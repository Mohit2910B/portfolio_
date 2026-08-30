import { revalidatePath } from "next/cache";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  carouselSettings,
  chatConversations,
  chatMessages,
  contactSettings,
  enquiries,
  homepageSettings,
  layoutSections,
  mediaFiles,
  notificationSettings,
  projects,
  services,
  skills,
  softwareTools,
  themeSettings,
  workOptions,
} from "@/db/schema";
import {
  ensureDatabase,
  CATEGORY_SEED,
  SERVICE_SEED,
  SKILL_SEED,
  SOFTWARE_TOOL_SEED,
  WORK_OPTION_SEED,
} from "@/lib/bootstrap";
import { HOME_FALLBACK, CONTACT_FALLBACK, invalidateSiteDataCache, setRuntimeOverride, getRuntimeOverride } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { badRequest, created, guard, notFound, num, ok, str, bool } from "@/lib/http";
import { deleteStoredFile, safeStoredName } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path?: string[] }> };
type ProjectInsert = typeof projects.$inferInsert;

function revalidatePublic() {
  try {
    invalidateSiteDataCache();
    revalidatePath("/");
  } catch {}
}

async function seg(ctx: Params): Promise<string[]> {
  const params = await ctx.params;
  return params.path ?? [];
}

async function one<T>(rows: T[]): Promise<T> {
  if (!rows[0]) throw notFound("Record not found.");
  return rows[0];
}

async function categoryLabelFor(categoryId: number | null): Promise<string> {
  if (!categoryId) return "";
  const rows = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  return rows[0]?.name ?? "";
}

async function nextSortOrder(tableName: string) {
  if (!REORDERABLE.has(tableName)) throw badRequest("Unknown collection.");
  const result = await db.execute(
    sql.raw(`select coalesce(max(sort_order), -1)::int as max from ${tableName}`),
  );
  const rows = (result.rows as { max: number }[]) ?? [];
  return Number(rows[0]?.max ?? -1) + 1;
}

function parseProjectBody(body: Record<string, unknown>): Partial<ProjectInsert> {
  const patch: Partial<ProjectInsert> = {};
  if ("title" in body) patch.title = str(body.title);
  if ("description" in body) patch.description = str(body.description);
  if ("aiLabType" in body) patch.aiLabType = str(body.aiLabType);
  if ("software" in body) patch.software = str(body.software);
  if ("tags" in body) patch.tags = str(body.tags);
  if ("externalLink" in body) patch.externalLink = str(body.externalLink);
  if ("videoSource" in body)
    patch.videoSource = str(body.videoSource, "url") === "upload" ? "upload" : "url";
  if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
  if ("thumbnailUrl" in body) patch.thumbnailUrl = str(body.thumbnailUrl);
  if ("aspectRatio" in body) patch.aspectRatio = str(body.aspectRatio, "16:9") || "16:9";
  if ("displaySize" in body) patch.displaySize = str(body.displaySize, "medium") || "medium";
  if ("demoStatus" in body) patch.demoStatus = str(body.demoStatus, "none") || "none";
  if ("categoryId" in body) patch.categoryId = num(body.categoryId);
  if ("year" in body) patch.year = num(body.year);
  if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
  if ("displayWidth" in body) patch.displayWidth = num(body.displayWidth);
  if ("displayHeight" in body) patch.displayHeight = num(body.displayHeight);
  if ("width" in body) patch.width = num(body.width);
  if ("height" in body) patch.height = num(body.height);
  if ("durationSeconds" in body) patch.durationSeconds = num(body.durationSeconds);
  if ("featured" in body) patch.featured = bool(body.featured);
  if ("published" in body) patch.published = bool(body.published);
  return patch;
}

const REORDERABLE = new Set(["projects", "categories", "skills", "services", "software_tools", "work_options"]);

async function reorder(tableName: string, id: number, direction: "up" | "down") {
  if (!REORDERABLE.has(tableName)) throw notFound("Unknown collection.");
  if (!Number.isInteger(id)) return badRequest("Invalid record id.");
  const result = await db.execute(
    sql.raw(`select id, sort_order from ${tableName} order by sort_order asc, id asc`),
  );
  const list = (result.rows as { id: number; sort_order: number }[]) ?? [];
  const index = list.findIndex((row) => row.id === id);
  if (index === -1) throw notFound("Record not found.");
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return ok({ moved: false });
  const a = list[index];
  const b = list[swapIndex];
  await db.execute(
    sql.raw(
      `update ${tableName} set sort_order = ${b.sort_order} where id = ${a.id}; ` +
        `update ${tableName} set sort_order = ${a.sort_order} where id = ${b.id};`,
    ),
  );
  return ok({ moved: true });
}

type TaxonomyTable = "categories" | "skills" | "services" | "work_options";

async function taxonomyPatch(table: TaxonomyTable, body: Record<string, unknown>) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if ("name" in body) patch.name = str(body.name);
  if ("label" in body) patch.label = str(body.label);
  if ("description" in body) patch.description = str(body.description);
  if ("category" in body) patch.category = str(body.category);
  if ("title" in body) patch.title = str(body.title);
  if ("deliverables" in body) patch.deliverables = str(body.deliverables);
  if ("icon" in body) patch.icon = str(body.icon);
  if ("priceFrom" in body) patch.priceFrom = str(body.priceFrom);
  if ("level" in body) patch.level = num(body.level);
  if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
  if ("isActive" in body) patch.isActive = bool(body.isActive);
  if ("value" in body) patch.value = str(body.value).toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const id = num(body.id);
  if (!id) throw badRequest("Missing record id.");

  try {
    if (table === "categories") {
      const updated = await db
        .update(categories)
        .set(patch as Partial<typeof categories.$inferInsert>)
        .where(eq(categories.id, id))
        .returning();
      return ok({ record: await one(updated) });
    }
    if (table === "skills") {
      const updated = await db
        .update(skills)
        .set(patch as Partial<typeof skills.$inferInsert>)
        .where(eq(skills.id, id))
        .returning();
      return ok({ record: await one(updated) });
    }
    if (table === "services") {
      const updated = await db
        .update(services)
        .set(patch as Partial<typeof services.$inferInsert>)
        .where(eq(services.id, id))
        .returning();
      return ok({ record: await one(updated) });
    }
    const updated = await db
      .update(workOptions)
      .set(patch as Partial<typeof workOptions.$inferInsert>)
      .where(eq(workOptions.id, id))
      .returning();
    return ok({ record: await one(updated) });
  } catch {
    return ok({ record: { id, ...patch } });
  }
}

export async function GET(_request: Request, ctx: Params) {
  return guard(async () => {
    await requireAdmin();

    const parts = await seg(ctx);
    const [resource, second, third] = parts;

    try {
      switch (resource) {
        case "stats": {
          const result = await db.execute(sql`
            SELECT
              (SELECT json_build_object(
                'total', count(*)::int,
                'published', count(*) filter (where published = true)::int,
                'drafts', count(*) filter (where published = false)::int,
                'featured', count(*) filter (where featured = true)::int,
                'demo', count(*) filter (where demo_status <> 'none')::int
              ) FROM projects) as projects,
              (SELECT count(*)::int FROM media_files) as media_files,
              (SELECT json_build_object(
                'total', count(*)::int,
                'unread', count(*) filter (where status = 'new')::int
              ) FROM enquiries) as enquiries,
              (SELECT json_build_object(
                'total', count(*)::int,
                'unread', coalesce(sum(admin_unread), 0)::int
              ) FROM chat_conversations) as chat,
              (SELECT count(*)::int FROM categories) as categories,
              (SELECT count(*)::int FROM skills) as skills,
              (SELECT count(*)::int FROM services) as services,
              (SELECT count(*)::int FROM software_tools) as software_tools
          `);
          const row = (result.rows?.[0] as Record<string, unknown>) ?? {};
          return ok({
            projects: row.projects ?? { total: 0, published: 0, drafts: 0, featured: 0, demo: 0 },
            mediaFiles: Number(row.media_files ?? 0),
            enquiries: row.enquiries ?? { total: 0, unread: 0 },
            chat: row.chat ?? { total: 0, unread: 0 },
            categories: Number(row.categories ?? 0),
            skills: Number(row.skills ?? 0),
            services: Number(row.services ?? 0),
            softwareTools: Number(row.software_tools ?? 0),
          });
        }

        case "projects": {
          if (second && third !== "duplicate") {
            const id = Number(second);
            const row = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
            return ok({ project: await one(row) });
          }
          const rows = await db
            .select({ project: projects, categoryName: categories.name })
            .from(projects)
            .leftJoin(categories, eq(categories.id, projects.categoryId))
            .orderBy(asc(projects.sortOrder), desc(projects.id));
          return ok({
            projects: rows.map((r) => ({ ...r.project, categoryName: r.categoryName ?? "" })),
          });
        }

        case "categories": {
          const rows = await db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
              description: categories.description,
              sortOrder: categories.sortOrder,
              isActive: categories.isActive,
              createdAt: categories.createdAt,
              updatedAt: categories.updatedAt,
              projectCount: sql<number>`(select count(*)::int from projects where projects.category_id = ${categories.id})`,
            })
            .from(categories)
            .orderBy(asc(categories.sortOrder), asc(categories.id));
          return ok({
            categories: rows.map((r) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description,
              sortOrder: r.sortOrder,
              isActive: r.isActive,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              projectCount: Number(r.projectCount ?? 0),
            })),
          });
        }

        case "skills":
          return ok({
            skills: await db.select().from(skills).orderBy(asc(skills.sortOrder), asc(skills.id)),
          });

      case "software-tools":
        return ok({
          softwareTools: await db
            .select()
            .from(softwareTools)
            .orderBy(asc(softwareTools.sortOrder), asc(softwareTools.id)),
        });

      case "services":
        return ok({
          services: await db
            .select()
            .from(services)
            .orderBy(asc(services.sortOrder), asc(services.id)),
        });

      case "work-options":
        return ok({
          workOptions: await db
            .select()
            .from(workOptions)
            .orderBy(asc(workOptions.sortOrder), asc(workOptions.id)),
        });

      case "media":
        return ok({ media: await db.select().from(mediaFiles).orderBy(desc(mediaFiles.id)) });

      case "carousel": {
        const rows = await db
          .select({ setting: carouselSettings, categoryName: categories.name })
          .from(carouselSettings)
          .leftJoin(categories, eq(categories.id, carouselSettings.categoryId))
          .orderBy(asc(carouselSettings.sortOrder), asc(carouselSettings.id));
        return ok({
          carousel: rows.map((r) => ({ ...r.setting, categoryName: r.categoryName ?? "All" })),
        });
      }

      case "settings": {
        if (second === "homepage") {
          let rows = await db.select().from(homepageSettings).limit(1);
          if (!rows[0]) {
            try {
              const inserted = await db.insert(homepageSettings).values({ id: 1, ...HOME_FALLBACK }).returning();
              rows = inserted;
            } catch {}
          }
          return ok({ settings: rows[0] ?? { id: 1, ...HOME_FALLBACK } });
        }
        if (second === "contact") {
          let rows = await db.select().from(contactSettings).limit(1);
          if (!rows[0]) {
            try {
              const inserted = await db.insert(contactSettings).values({ id: 1, ...CONTACT_FALLBACK }).returning();
              rows = inserted;
            } catch {}
          }
          return ok({ settings: rows[0] ?? { id: 1, ...CONTACT_FALLBACK } });
        }
        if (second === "theme") {
          let rows = await db.select().from(themeSettings).limit(1);
          if (!rows[0]) {
            try {
              const inserted = await db
                .insert(themeSettings)
                .values({ id: 1, accent: "#e0147f", glassOpacity: 45, glassBlur: 20, grain: true })
                .returning();
              rows = inserted;
            } catch {}
          }
          return ok({
            settings: rows[0] ?? { id: 1, accent: "#e0147f", glassOpacity: 45, glassBlur: 20, grain: true },
          });
        }
        if (second === "notifications") {
          let rows = await db.select().from(notificationSettings).limit(1);
          if (!rows[0]) {
            try {
              const inserted = await db
                .insert(notificationSettings)
                .values({ id: 1, emailEnabled: true, notificationEmail: "mohitbabariyaa@gmail.com", adminStatus: "offline", aiAutoReply: true })
                .returning();
              rows = inserted;
            } catch {}
          }
          return ok({
            settings: rows[0] ?? { id: 1, emailEnabled: true, notificationEmail: "mohitbabariyaa@gmail.com", adminStatus: "offline", aiAutoReply: true },
          });
        }
        throw notFound("Unknown settings resource.");
      }

      case "layout":
        return ok({
          sections: await db
            .select()
            .from(layoutSections)
            .orderBy(asc(layoutSections.sortOrder), asc(layoutSections.id)),
        });

      case "enquiries": {
        const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
        return ok({ enquiries: rows, unread: rows.filter((r) => r.status === "new").length });
      }

      case "chat": {
        if (second === "status") {
          const rows = await db.select().from(notificationSettings).limit(1);
          const s = rows[0];
          return ok({
            adminStatus: s?.adminStatus || "offline",
            aiAutoReply: s?.aiAutoReply !== false,
          });
        }
        if (second !== "conversations") throw notFound("Unknown chat resource.");
        if (!third) {
          const rows = await db
            .select()
            .from(chatConversations)
            .orderBy(desc(chatConversations.updatedAt));
          const now = Date.now();
          return ok({
            conversations: rows.map((c) => ({
              ...c,
              online: Boolean(
                c.customerSeenAt && now - new Date(c.customerSeenAt).getTime() < 3 * 60 * 1000,
              ),
            })),
          });
        }
        const id = Number(third);
        const conversation = await one(
          await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1),
        );
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, id))
          .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
        await db
          .update(chatMessages)
          .set({ isRead: true })
          .where(
            sql`${chatMessages.conversationId} = ${id} and ${chatMessages.senderType} = 'customer' and ${chatMessages.isRead} = false`,
          );
        await db.update(chatConversations).set({ adminUnread: 0 }).where(eq(chatConversations.id, id));
        return ok({ conversation, messages });
      }

      case "backup": {
        const [
          projectRows,
          categoryRows,
          skillRows,
          softwareRows,
          serviceRows,
          carouselRows,
          layoutRows,
          homeRows,
          contactRows,
          themeRows,
          workRows,
          enquiryRows,
          convoRows,
          messageRows,
          mediaRows,
        ] = await Promise.all([
          db.select().from(projects),
          db.select().from(categories),
          db.select().from(skills),
          db.select().from(softwareTools),
          db.select().from(services),
          db.select().from(carouselSettings),
          db.select().from(layoutSections),
          db.select().from(homepageSettings),
          db.select().from(contactSettings),
          db.select().from(themeSettings),
          db.select().from(workOptions),
          db.select().from(enquiries),
          db.select().from(chatConversations),
          db.select().from(chatMessages),
          db.select().from(mediaFiles),
        ]);
        return ok({
          generatedAt: new Date().toISOString(),
          version: 1,
          data: {
            projects: projectRows,
            categories: categoryRows,
            skills: skillRows,
            software_tools: softwareRows,
            services: serviceRows,
            carousel_settings: carouselRows,
            layout_sections: layoutRows,
            homepage_settings: homeRows,
            contact_settings: contactRows,
            theme_settings: themeRows,
            work_options: workRows,
            enquiries: enquiryRows,
            chat_conversations: convoRows,
            chat_messages: messageRows,
            media_files: mediaRows,
          },
        });
      }

        default:
          return notFound(
            `Unknown admin endpoint: /api/admin/${parts.filter(Boolean).join("/")}`,
          );
      }
    } catch (err) {
      console.warn(`[admin] GET /api/admin/${parts.join("/")} DB unconfigured fallback:`, err);
      switch (resource) {
        case "stats":
          return ok({
            projects: { total: 0, published: 0, drafts: 0, featured: 0, demo: 0 },
            mediaFiles: 0,
            enquiries: { total: 0, unread: 0 },
            chat: { total: 0, unread: 0 },
            categories: CATEGORY_SEED.length,
            skills: SKILL_SEED.length,
            services: SERVICE_SEED.length,
            softwareTools: SOFTWARE_TOOL_SEED.length,
          });
        case "projects":
          return ok({ projects: [] });
        case "categories":
          return ok({
            categories: CATEGORY_SEED.map(([name, description], i) => ({
              id: i + 1,
              name,
              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description,
              sortOrder: i,
              isActive: true,
              projectCount: 0,
            })),
          });
        case "services":
          return ok({
            services: SERVICE_SEED.map((s, i) => ({
              id: i + 1,
              title: s.title,
              description: s.description,
              deliverables: s.deliverables,
              icon: s.icon,
              sortOrder: i,
              isActive: true,
            })),
          });
        case "skills":
          return ok({
            skills: SKILL_SEED.map(([name, category, description, level], i) => ({
              id: i + 1,
              name,
              category,
              description,
              level,
              sortOrder: i,
              isActive: true,
            })),
          });
        case "software-tools":
          return ok({
            softwareTools: SOFTWARE_TOOL_SEED.map(([name, category, icon, level], i) => ({
              id: i + 1,
              name,
              category,
              icon,
              level,
              sortOrder: i,
              isActive: true,
            })),
          });
        case "work-options":
          return ok({
            workOptions: WORK_OPTION_SEED.map((label, i) => ({
              id: i + 1,
              label,
              value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              sortOrder: i,
              isActive: true,
            })),
          });
        case "media":
          return ok({ media: [] });
        case "carousel":
          return ok({ carousel: [] });
        case "settings":
          if (second === "notifications") {
            return ok({
              settings: {
                id: 1,
                emailEnabled: true,
                notificationEmail:
                  process.env.NOTIFICATION_EMAIL ||
                  process.env.SEED_ADMIN_EMAIL ||
                  "mohitbabariyaa@gmail.com",
              },
            });
          }
          return ok({ settings: null });
        case "layout":
          return ok({ sections: [] });
        case "enquiries":
          return ok({ enquiries: [], unread: 0 });
        case "chat":
          return ok({ conversations: [] });
        case "backup":
          return ok({ generatedAt: new Date().toISOString(), version: 1, data: {} });
        default:
          return ok({});
      }
    }
  });
}

/* ------------------------------- POST ------------------------------ */

export async function POST(request: Request, ctx: Params) {
  return guard(async () => {
    await requireAdmin();
    revalidatePublic();
    const parts = await seg(ctx);
    const [resource, second, third, fourth] = parts;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    switch (resource) {
      case "projects": {
        if (second && third === "duplicate") {
          const id = Number(second);
          const source = await one(
            await db.select().from(projects).where(eq(projects.id, id)).limit(1),
          );
          const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = source;
          const copy = await db
            .insert(projects)
            .values({
              ...rest,
              title: `${source.title} (copy)`,
              sortOrder: await nextSortOrder("projects"),
              featured: false,
            })
            .returning();
          return created({ project: copy[0] });
        }
        if (second === "reorder") {
          return reorder(
            "projects",
            Number(body.id),
            str(body.direction, "up") === "down" ? "down" : "up",
          );
        }

        const patch = parseProjectBody(body);
        if (!patch.title) return badRequest("Project title is required.", { title: "Required" });
        if (!patch.categoryId) return badRequest("Category is required.", { categoryId: "Required" });
        patch.categoryLabel = await categoryLabelFor(patch.categoryId);
        patch.sortOrder = patch.sortOrder ?? (await nextSortOrder("projects"));
        const inserted = await db.insert(projects).values(patch as ProjectInsert).returning();
        return created({ project: inserted[0] });
      }

      case "categories": {
        if (second === "reorder") {
          return reorder(
            "categories",
            Number(body.id),
            str(body.direction, "up") === "down" ? "down" : "up",
          );
        }
        const name = str(body.name);
        if (!name) return badRequest("Category name is required.", { name: "Required" });
        const inserted = await db
          .insert(categories)
          .values({
            name,
            slug: str(body.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: str(body.description),
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("categories")),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        const category = inserted[0];
        await db.insert(carouselSettings).values({
          categoryId: category.id,
          slots: 5,
          autoFill: true,
          sortOrder: category.sortOrder,
        });
        return created({ category });
      }

      case "skills": {
        if (second === "reorder") {
          return reorder(
            "skills",
            Number(body.id),
            str(body.direction, "up") === "down" ? "down" : "up",
          );
        }
        const name = str(body.name);
        if (!name) return badRequest("Skill name is required.", { name: "Required" });
        const inserted = await db
          .insert(skills)
          .values({
            name,
            category: str(body.category),
            description: str(body.description),
            level: num(body.level),
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("skills")),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ skill: inserted[0] });
      }

      case "software-tools": {
        if (second === "reorder") {
          return reorder(
            "software_tools",
            Number(body.id),
            str(body.direction, "up") === "down" ? "down" : "up",
          );
        }
        const name = str(body.name);
        if (!name) return badRequest("Software name is required.", { name: "Required" });
        const inserted = await db
          .insert(softwareTools)
          .values({
            name,
            category: str(body.category),
            icon: str(body.icon, "generic") || "generic",
            proficiency: num(body.proficiency),
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("software_tools")),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ softwareTool: inserted[0] });
      }

      case "services": {
        if (second === "reorder") {
          return reorder(
            "services",
            Number(body.id),
            str(body.direction, "up") === "down" ? "down" : "up",
          );
        }
        const title = str(body.title);
        if (!title) return badRequest("Service title is required.", { title: "Required" });
        const inserted = await db
          .insert(services)
          .values({
            title,
            description: str(body.description),
            deliverables: str(body.deliverables),
            icon: str(body.icon),
            priceFrom: str(body.priceFrom),
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("services")),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ service: inserted[0] });
      }

      case "work-options": {
        const label = str(body.label);
        if (!label) return badRequest("Label is required.", { label: "Required" });
        const inserted = await db
          .insert(workOptions)
          .values({
            label,
            value: str(body.value) || label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("work_options")),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ workOption: inserted[0] });
      }

      case "media": {
        const url = str(body.url);
        const originalName = str(body.originalName) || str(body.name) || "Media asset";
        const kind = str(body.kind, "image") === "video" ? "video" : "image";
        if (!url) return badRequest("Media URL is required.", { url: "Required" });
        const filename = safeStoredName(originalName, kind === "video" ? "video/mp4" : "image/jpeg");
        const inserted = await db
          .insert(mediaFiles)
          .values({
            filename,
            originalName,
            mimeType: kind === "video" ? "video/mp4" : "image/jpeg",
            kind,
            size: num(body.size) ?? 0,
            url,
            width: num(body.width),
            height: num(body.height),
          })
          .returning();
        return created({ media: inserted[0], url, kind });
      }

      case "carousel": {
        if (second === "reorder") {
          const id = Number(body.id);
          const direction = str(body.direction, "up") === "down" ? "down" : "up";
          const rows = await db
            .select()
            .from(carouselSettings)
            .orderBy(asc(carouselSettings.sortOrder), asc(carouselSettings.id));
          const index = rows.findIndex((r) => r.id === id);
          if (index === -1) throw notFound("Carousel setting not found.");
          const swap = direction === "up" ? index - 1 : index + 1;
          if (swap < 0 || swap >= rows.length) return ok({ moved: false });
          await db
            .update(carouselSettings)
            .set({ sortOrder: rows[swap].sortOrder })
            .where(eq(carouselSettings.id, rows[index].id));
          await db
            .update(carouselSettings)
            .set({ sortOrder: rows[index].sortOrder })
            .where(eq(carouselSettings.id, rows[swap].id));
          return ok({ moved: true });
        }
        const inserted = await db
          .insert(carouselSettings)
          .values({
            categoryId: num(body.categoryId),
            slots: Math.min(Math.max(num(body.slots) ?? 5, 1), 24),
            centerSize: str(body.centerSize, "large"),
            sideSize: str(body.sideSize, "small"),
            autoFill: "autoFill" in body ? bool(body.autoFill) : true,
            projectIds: JSON.stringify(Array.isArray(body.projectIds) ? body.projectIds : []),
            sortOrder: num(body.sortOrder) ?? 0,
          })
          .returning();
        return created({ setting: inserted[0] });
      }

      case "layout": {
        if (second === "reorder") {
          const ids = Array.isArray(body.ids) ? body.ids.map((v) => Number(v)) : [];
          if (ids.length === 0) return badRequest("Provide an ordered list of section ids.");
          for (let i = 0; i < ids.length; i += 1) {
            await db
              .update(layoutSections)
              .set({ sortOrder: i, updatedAt: new Date() })
              .where(eq(layoutSections.id, ids[i]));
          }
          return ok({ updated: ids.length });
        }
        const key = str(body.sectionKey);
        const label = str(body.label);
        if (!key || !label) return badRequest("sectionKey and label are required.");
        const inserted = await db
          .insert(layoutSections)
          .values({ sectionKey: key, label, sortOrder: num(body.sortOrder) ?? 0, isVisible: true })
          .returning();
        return created({ section: inserted[0] });
      }

      case "restore": {
        const data = (body as { data?: Record<string, unknown> }).data;
        if (!data || typeof data !== "object") return badRequest("Invalid backup payload.");
        let restored = 0;
        if (Array.isArray(data.projects)) {
          await db.delete(projects);
          for (const row of data.projects as Record<string, unknown>[]) {
            const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = row;
            await db.insert(projects).values(rest as ProjectInsert);
            restored += 1;
          }
        }
        if (Array.isArray(data.skills)) {
          await db.delete(skills);
          for (const row of data.skills as Record<string, unknown>[]) {
            const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = row;
            await db.insert(skills).values(rest as typeof skills.$inferInsert);
            restored += 1;
          }
        }
        if (Array.isArray(data.services)) {
          await db.delete(services);
          for (const row of data.services as Record<string, unknown>[]) {
            const { id: _i, createdAt: _c, updatedAt: _u, ...rest } = row;
            await db.insert(services).values(rest as typeof services.$inferInsert);
            restored += 1;
          }
        }
        return ok({ restored });
      }

      case "chat": {
        if (second === "conversations" && fourth === "reply") {
          const conversationId = Number(third);
          if (!Number.isInteger(conversationId)) return badRequest("Invalid conversation id.");
          const message = str(body.message);
          if (!message) return badRequest("Type a reply first.");
          const inserted = await db
            .insert(chatMessages)
            .values({ conversationId, senderType: "admin", message })
            .returning();
          await db
            .update(chatConversations)
            .set({
              lastMessage: message.slice(0, 240),
              customerUnread: sql`${chatConversations.customerUnread} + 1`,
              updatedAt: sql`now()`,
            })
            .where(eq(chatConversations.id, conversationId));
          return created({ message: inserted[0] });
        }
        throw notFound("Unknown chat action.");
      }

      default:
        return notFound(`Unknown admin endpoint: /api/admin/${parts.filter(Boolean).join("/")}`);
    }
  });
}

/* ------------------------------- PATCH ----------------------------- */

export async function PATCH(request: Request, ctx: Params) {
  return guard(async () => {
    await requireAdmin();
    revalidatePublic();
    const parts = await seg(ctx);
    const [resource, second, third] = parts;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    switch (resource) {
      case "projects": {
        const id = Number(second);
        if (!Number.isInteger(id)) return badRequest("Invalid project id.");

        if (third === "replace-video") {
          const patch: Partial<ProjectInsert> = { updatedAt: new Date() };
          if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
          if ("videoSource" in body)
            patch.videoSource = str(body.videoSource, "url") === "upload" ? "upload" : "url";
          if (body.thumbnailUrl !== undefined && str(body.thumbnailUrl)) {
            patch.thumbnailUrl = str(body.thumbnailUrl);
          }
          if ("width" in body) patch.width = num(body.width);
          if ("height" in body) patch.height = num(body.height);
          if ("durationSeconds" in body) patch.durationSeconds = num(body.durationSeconds);
          if (!patch.videoUrl) return badRequest("Provide a video URL or upload a file.");
          const updated = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
          return ok({ project: await one(updated) });
        }

        const patch = parseProjectBody(body);
        if (patch.categoryId !== undefined) {
          patch.categoryLabel = await categoryLabelFor(patch.categoryId);
        }
        if (Object.keys(patch).length === 0) return badRequest("Nothing to update.");
        patch.updatedAt = new Date();
        const updated = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
        return ok({ project: await one(updated) });
      }

      case "categories":
        if (!second) return badRequest("Missing category id.");
        return taxonomyPatch("categories", { ...body, id: Number(second) });

      case "skills":
        if (!second) return badRequest("Missing skill id.");
        return taxonomyPatch("skills", { ...body, id: Number(second) });

      case "services":
        if (!second) return badRequest("Missing service id.");
        return taxonomyPatch("services", { ...body, id: Number(second) });

      case "software-tools": {
        if (!second) return badRequest("Missing software tool id.");
        const id = Number(second);
        const patch: Partial<typeof softwareTools.$inferInsert> = { updatedAt: new Date() };
        if ("name" in body) patch.name = str(body.name);
        if ("category" in body) patch.category = str(body.category);
        if ("icon" in body) patch.icon = str(body.icon, "generic") || "generic";
        if ("proficiency" in body) patch.proficiency = num(body.proficiency);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
        if ("isActive" in body) patch.isActive = bool(body.isActive);
        const updated = await db
          .update(softwareTools)
          .set(patch)
          .where(eq(softwareTools.id, id))
          .returning();
        return ok({ softwareTool: await one(updated) });
      }

      case "work-options":
        if (!second) return badRequest("Missing option id.");
        return taxonomyPatch("work_options", { ...body, id: Number(second) });

      case "media": {
        const updated = await db
          .update(mediaFiles)
          .set({
            originalName: str(body.originalName) || undefined,
            width: num(body.width) ?? undefined,
            height: num(body.height) ?? undefined,
          })
          .where(eq(mediaFiles.id, Number(second)))
          .returning();
        return ok({ media: await one(updated) });
      }

      case "carousel": {
        const patch: Partial<typeof carouselSettings.$inferInsert> = { updatedAt: new Date() };
        if ("categoryId" in body) patch.categoryId = num(body.categoryId);
        if ("slots" in body) patch.slots = Math.min(Math.max(num(body.slots) ?? 5, 1), 24);
        if ("centerSize" in body) patch.centerSize = str(body.centerSize, "large");
        if ("sideSize" in body) patch.sideSize = str(body.sideSize, "small");
        if ("autoFill" in body) patch.autoFill = bool(body.autoFill);
        if ("isActive" in body) patch.isActive = bool(body.isActive);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
        if ("projectIds" in body) {
          patch.projectIds = JSON.stringify(
            Array.isArray(body.projectIds) ? body.projectIds.map((v) => Number(v)) : [],
          );
        }
        const updated = await db
          .update(carouselSettings)
          .set(patch)
          .where(eq(carouselSettings.id, Number(second)))
          .returning();
        return ok({ setting: await one(updated) });
      }

      case "layout": {
        const patch: Partial<typeof layoutSections.$inferInsert> = { updatedAt: new Date() };
        if ("label" in body) patch.label = str(body.label);
        if ("isVisible" in body) patch.isVisible = bool(body.isVisible);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
        const updated = await db
          .update(layoutSections)
          .set(patch)
          .where(eq(layoutSections.id, Number(second)))
          .returning();
        return ok({ section: await one(updated) });
      }

      case "settings": {
        const now = new Date();
        if (second === "homepage") {
          const patch: Partial<typeof homepageSettings.$inferInsert> = { updatedAt: now };
          for (const key of [
            "ownerName",
            "heroName",
            "heroTitle",
            "heroSubtitle",
            "heroDescription",
            "availabilityLabel",
            "ctaPrimaryLabel",
            "ctaSecondaryLabel",
            "reelUrl",
            "aboutIntro",
            "aboutExperience",
            "aboutFocus",
            "aboutWorkflow",
            "aboutTools",
            "aboutStrengths",
            "footerNote",
          ] as const) {
            if (key in body) patch[key] = str(body[key]);
          }
          const currentHome = getRuntimeOverride("homepage") || HOME_FALLBACK;
          const mergedHome = { ...currentHome, ...patch };
          setRuntimeOverride("homepage", mergedHome as typeof HOME_FALLBACK);

          try {
            const existing = await db.select().from(homepageSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db
                .insert(homepageSettings)
                .values({ id: 1, ...patch })
                .returning();
              return ok({ settings: inserted[0] });
            }
            const updated = await db
              .update(homepageSettings)
              .set(patch)
              .where(eq(homepageSettings.id, existing[0].id))
              .returning();
            return ok({ settings: updated[0] });
          } catch {
            return ok({ settings: mergedHome });
          }
        }
        if (second === "contact") {
          const patch: Partial<typeof contactSettings.$inferInsert> = { updatedAt: now };
          for (const key of [
            "email",
            "countryCode",
            "phone",
            "whatsapp",
            "location",
            "instagram",
            "youtube",
            "linkedin",
            "responseTime",
          ] as const) {
            if (key in body) patch[key] = str(body[key]);
          }
          const currentContact = getRuntimeOverride("contact") || CONTACT_FALLBACK;
          const mergedContact = { ...currentContact, ...patch };
          setRuntimeOverride("contact", mergedContact as typeof CONTACT_FALLBACK);

          try {
            const existing = await db.select().from(contactSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db
                .insert(contactSettings)
                .values({ id: 1, ...patch })
                .returning();
              return ok({ settings: inserted[0] });
            }
            const updated = await db
              .update(contactSettings)
              .set(patch)
              .where(eq(contactSettings.id, existing[0].id))
              .returning();
            return ok({ settings: updated[0] });
          } catch {
            return ok({ settings: mergedContact });
          }
        }
        if (second === "notifications") {
          const patch: Partial<typeof notificationSettings.$inferInsert> = { updatedAt: now };
          if ("emailEnabled" in body) patch.emailEnabled = bool(body.emailEnabled);
          if ("notificationEmail" in body) patch.notificationEmail = str(body.notificationEmail).toLowerCase();
          if ("adminStatus" in body) patch.adminStatus = str(body.adminStatus, "offline") === "online" ? "online" : "offline";
          if ("aiAutoReply" in body) patch.aiAutoReply = bool(body.aiAutoReply);

          if (!globalThis.__runtimeSiteDataOverrides) globalThis.__runtimeSiteDataOverrides = {};
          const currentNotif = globalThis.__runtimeSiteDataOverrides.notificationSettings || {
            id: 1,
            emailEnabled: true,
            notificationEmail: "mohitbabariyaa@gmail.com",
            adminStatus: "offline",
            aiAutoReply: true,
          };
          const mergedNotif = { ...currentNotif, ...patch };
          globalThis.__runtimeSiteDataOverrides.notificationSettings = mergedNotif as typeof currentNotif;

          try {
            const existing = await db.select().from(notificationSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db.insert(notificationSettings).values({ id: 1, ...patch }).returning();
              return ok({ settings: inserted[0] });
            }
            const updated = await db.update(notificationSettings).set(patch).where(eq(notificationSettings.id, existing[0].id)).returning();
            return ok({ settings: updated[0] });
          } catch {
            return ok({ settings: mergedNotif });
          }
        }
        if (second === "theme") {
          const patch: Partial<typeof themeSettings.$inferInsert> = { updatedAt: now };
          if ("accent" in body) patch.accent = str(body.accent, "#e0147f") || "#e0147f";
          if ("glassOpacity" in body)
            patch.glassOpacity = Math.min(Math.max(num(body.glassOpacity) ?? 45, 0), 100);
          if ("glassBlur" in body)
            patch.glassBlur = Math.min(Math.max(num(body.glassBlur) ?? 20, 0), 40);
          if ("grain" in body) patch.grain = bool(body.grain);

          const currentTheme = getRuntimeOverride("theme") || { id: 1, accent: "#e0147f", glassOpacity: 45, glassBlur: 20, grain: true, updatedAt: new Date() };
          const mergedTheme = { ...currentTheme, ...patch };
          setRuntimeOverride("theme", mergedTheme as typeof currentTheme);

          try {
            const existing = await db.select().from(themeSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db.insert(themeSettings).values({ id: 1, ...patch }).returning();
              return ok({ settings: inserted[0] });
            }
            const updated = await db
              .update(themeSettings)
              .set(patch)
              .where(eq(themeSettings.id, existing[0].id))
              .returning();
            return ok({ settings: updated[0] });
          } catch {
            return ok({ settings: mergedTheme });
          }
        }
        throw notFound("Unknown settings resource.");
      }

      case "enquiries": {
        const status = str(body.status);
        if (!["new", "read", "archived"].includes(status)) return badRequest("Invalid status.");
        const updated = await db
          .update(enquiries)
          .set({ status })
          .where(eq(enquiries.id, Number(second)))
          .returning();
        return ok({ enquiry: await one(updated) });
      }

      case "chat": {
        if (second === "status") {
          const patch: Partial<typeof notificationSettings.$inferInsert> = { updatedAt: new Date() };
          if ("adminStatus" in body) patch.adminStatus = str(body.adminStatus, "offline") === "online" ? "online" : "offline";
          if ("aiAutoReply" in body) patch.aiAutoReply = bool(body.aiAutoReply);
          const existing = await db.select().from(notificationSettings).limit(1);
          if (!existing[0]) {
            const inserted = await db.insert(notificationSettings).values({ id: 1, ...patch }).returning();
            return ok({ status: inserted[0] });
          }
          const updated = await db.update(notificationSettings).set(patch).where(eq(notificationSettings.id, existing[0].id)).returning();
          return ok({ status: updated[0] });
        }

        const id = Number(second === "conversations" ? third : second);
        if (!Number.isInteger(id)) return badRequest("Invalid conversation id.");
        if (bool(body.markRead)) {
          await db
            .update(chatMessages)
            .set({ isRead: true })
            .where(
              sql`${chatMessages.conversationId} = ${id} and ${chatMessages.senderType} = 'customer' and ${chatMessages.isRead} = false`,
            );
          const updated = await db
            .update(chatConversations)
            .set({ adminUnread: 0, updatedAt: new Date() })
            .where(eq(chatConversations.id, id))
            .returning();
          return ok({ conversation: await one(updated) });
        }
        const patch: Partial<typeof chatConversations.$inferInsert> = { updatedAt: new Date() };
        if ("status" in body) patch.status = str(body.status, "open") === "closed" ? "closed" : "open";
        const updated = await db
          .update(chatConversations)
          .set(patch)
          .where(eq(chatConversations.id, id))
          .returning();
        return ok({ conversation: await one(updated) });
      }

      default:
        return notFound(`Unknown admin endpoint: /api/admin/${parts.filter(Boolean).join("/")}`);
    }
  });
}

export const PUT = PATCH;

/* ------------------------------- DELETE ---------------------------- */

export async function DELETE(_request: Request, ctx: Params) {
  return guard(async () => {
    await requireAdmin();
    revalidatePublic();
    const parts = await seg(ctx);
    const [resource, second] = parts;
    const id = Number(second);
    if (!Number.isInteger(id)) return badRequest("Invalid id.");

    switch (resource) {
      case "projects": {
        const project = await one(
          await db.select().from(projects).where(eq(projects.id, id)).limit(1),
        );
        await db.delete(projects).where(eq(projects.id, id));
        await deleteStoredFile(project.videoUrl);
        await deleteStoredFile(project.thumbnailUrl);
        return ok({ deleted: id });
      }
      case "categories":
        await db.delete(categories).where(eq(categories.id, id));
        return ok({ deleted: id });
      case "skills":
        await db.delete(skills).where(eq(skills.id, id));
        return ok({ deleted: id });
      case "services":
        await db.delete(services).where(eq(services.id, id));
        return ok({ deleted: id });
      case "software-tools":
        await db.delete(softwareTools).where(eq(softwareTools.id, id));
        return ok({ deleted: id });
      case "work-options":
        await db.delete(workOptions).where(eq(workOptions.id, id));
        return ok({ deleted: id });
      case "media": {
        const media = await one(
          await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1),
        );
        await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
        await deleteStoredFile(media.url);
        return ok({ deleted: id });
      }
      case "carousel":
        await db.delete(carouselSettings).where(eq(carouselSettings.id, id));
        return ok({ deleted: id });
      case "layout":
        await db.delete(layoutSections).where(eq(layoutSections.id, id));
        return ok({ deleted: id });
      case "enquiries":
        await db.delete(enquiries).where(eq(enquiries.id, id));
        return ok({ deleted: id });
      case "chat":
        await db.delete(chatConversations).where(eq(chatConversations.id, id));
        return ok({ deleted: id });
      default:
        return notFound(`Unknown admin endpoint: /api/admin/${parts.filter(Boolean).join("/")}`);
    }
  });
}
