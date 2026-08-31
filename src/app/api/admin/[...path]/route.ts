import { revalidatePath } from "next/cache";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  admins,
  categories,
  chatConversations,
  chatMessages,
  contactSettings,
  enquiries,
  homepageSettings,
  layoutSections,
  notificationSettings,
  projects,
  carouselItems,
  carouselGlobalSettings,
  mediaFiles,
  services,
  skills,
  softwareTools,
  themeSettings,
  workOptions,
} from "@/db/schema";
import {
  HOME_FALLBACK,
  CONTACT_FALLBACK,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { badRequest, created, guard, notFound, num, ok, str, bool } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path?: string[] }> };

function revalidatePublic() {
  try {
    revalidatePath("/", "page");
    revalidatePath("/", "layout");
    revalidatePath("/admin", "page");
    revalidatePath("/admin", "layout");
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

const REORDERABLE = new Set(["categories", "skills", "services", "software_tools", "work_options"]);

async function nextSortOrder(tableName: string) {
  if (!REORDERABLE.has(tableName)) throw badRequest("Unknown collection.");
  const result = await db.execute(
    sql.raw(`select coalesce(max(sort_order), -1)::int as max from ${tableName}`),
  );
  const rows = (result.rows as { max: number }[]) ?? [];
  return Number(rows[0]?.max ?? -1) + 1;
}

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
  if ("isActive" in body) patch.isActive = body.isActive === true || body.isActive === "true";

  const id = num(body.id);
  if (!id) throw badRequest("Missing record id.");

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
}

export async function GET(_request: Request, ctx: Params) {
  return guard(async () => {
    await requireAdmin();

    const parts = await seg(ctx);
    const [resource, second] = parts;

    try {
      switch (resource) {
        case "stats": {
          const result = await db.execute(sql`
            SELECT
              (SELECT json_build_object(
                'total', count(*)::int,
                'unread', count(*) filter (where status = 'new')::int
              ) FROM inquiries) as enquiries,
              (SELECT json_build_object(
                'total', count(*)::int,
                'unread', coalesce(sum(admin_unread), 0)::int
              ) FROM chat_conversations) as chat,
              (SELECT count(*)::int FROM categories) as categories,
              (SELECT count(*)::int FROM skills) as skills,
              (SELECT count(*)::int FROM services) as services,
              (SELECT count(*)::int FROM software_tools) as software_tools,
              (SELECT count(*)::int FROM projects) as projects,
              (SELECT count(*)::int FROM carousel_items) as carousel_items,
              (SELECT count(*)::int FROM media_files) as media_files
          `);
          const row = (result.rows?.[0] as Record<string, unknown>) ?? {};
          return ok({
            enquiries: row.enquiries ?? { total: 0, unread: 0 },
            chat: row.chat ?? { total: 0, unread: 0 },
            categories: Number(row.categories ?? 0),
            skills: Number(row.skills ?? 0),
            services: Number(row.services ?? 0),
            softwareTools: Number(row.software_tools ?? 0),
            projects: Number(row.projects ?? 0),
            carouselItems: Number(row.carousel_items ?? 0),
            mediaFiles: Number(row.media_files ?? 0),
          });
        }

        case "projects": {
          const rows = await db
            .select()
            .from(projects)
            .orderBy(asc(projects.sortOrder), desc(projects.id));
          return ok({ projects: rows });
        }

        case "carousel": {
          const items = await db
            .select()
            .from(carouselItems)
            .orderBy(asc(carouselItems.sortOrder), asc(carouselItems.id));
          const global = await db.select().from(carouselGlobalSettings).limit(1);
          return ok({ items, globalSettings: global[0] ?? null });
        }

        case "media": {
          const rows = await db
            .select()
            .from(mediaFiles)
            .orderBy(desc(mediaFiles.id));
          return ok({ media: rows });
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
            })
            .from(categories)
            .orderBy(asc(categories.sortOrder), asc(categories.id));
          return ok({ categories: rows });
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
            try {
              const rows = await db.select().from(notificationSettings).limit(1);
              const s = rows[0];
              if (s) {
                return ok({
                  adminStatus: s.adminStatus || "offline",
                  aiAutoReply: s.aiAutoReply !== false,
                });
              }
            } catch {}
            return ok({ adminStatus: "offline", aiAutoReply: true });
          }
          if (second !== "conversations") throw notFound("Unknown chat resource.");
          if (!parts[2]) {
            const rows = await db
              .select()
              .from(chatConversations)
              .orderBy(desc(chatConversations.updatedAt));
            const now = Date.now();
            const convos = rows.map((r) => ({
              ...r,
              online: Boolean(r.customerSeenAt && now - new Date(r.customerSeenAt).getTime() < 3 * 60 * 1000),
            }));
            return ok({ conversations: convos });
          }
          const id = Number(parts[2]);
          const rows = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
          if (!rows[0]) throw notFound("Conversation not found.");
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
          return ok({ conversation: rows[0], messages });
        }

        case "backup": {
          const [
            categoryRows,
            skillRows,
            softwareRows,
            serviceRows,
            layoutRows,
            homeRows,
            contactRows,
            themeRows,
            workRows,
            enquiryRows,
            convoRows,
            messageRows,
          ] = await Promise.all([
            db.select().from(categories),
            db.select().from(skills),
            db.select().from(softwareTools),
            db.select().from(services),
            db.select().from(layoutSections),
            db.select().from(homepageSettings),
            db.select().from(contactSettings),
            db.select().from(themeSettings),
            db.select().from(workOptions),
            db.select().from(enquiries),
            db.select().from(chatConversations),
            db.select().from(chatMessages),
          ]);
          return ok({
            generatedAt: new Date().toISOString(),
            version: 1,
            data: {
              categories: categoryRows,
              skills: skillRows,
              software_tools: softwareRows,
              services: serviceRows,
              layout_sections: layoutRows,
              homepage_settings: homeRows,
              contact_settings: contactRows,
              theme_settings: themeRows,
              work_options: workRows,
              enquiries: enquiryRows,
              chat_conversations: convoRows,
              chat_messages: messageRows,
            },
          });
        }

        default:
          return notFound(
            `Unknown admin endpoint: /api/admin/${parts.filter(Boolean).join("/")}`,
          );
      }
    } catch (err) {
      console.warn(`[admin] GET /api/admin/${parts.join("/")} error:`, err);
      return ok({});
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
        const title = str(body.title);
        if (!title) return badRequest("Project title is required.", { title: "Required" });
        const inserted = await db
          .insert(projects)
          .values({
            title,
            description: str(body.description),
            categoryId: num(body.categoryId),
            categoryLabel: str(body.categoryLabel),
            aiLabType: str(body.aiLabType),
            year: num(body.year) ?? 2026,
            software: str(body.software),
            tags: str(body.tags),
            externalLink: str(body.externalLink),
            videoSource: str(body.videoSource, "upload"),
            videoUrl: str(body.videoUrl),
            thumbnailUrl: str(body.thumbnailUrl),
            aspectRatio: str(body.aspectRatio, "16:9"),
            displaySize: str(body.displaySize, "medium"),
            displayWidth: num(body.displayWidth) ?? 540,
            displayHeight: num(body.displayHeight) ?? 960,
            width: num(body.width) ?? 1080,
            height: num(body.height) ?? 1920,
            durationSeconds: num(body.durationSeconds) ?? 30,
            featured: "featured" in body ? bool(body.featured) : true,
            published: "published" in body ? bool(body.published) : true,
            sortOrder: num(body.sortOrder) ?? 0,
            demoStatus: str(body.demoStatus, "verified"),
            carouselEnabled: "carouselEnabled" in body ? bool(body.carouselEnabled) : true,
            carouselPinned: "carouselPinned" in body ? bool(body.carouselPinned) : false,
            carouselOrder: num(body.carouselOrder) ?? 0,
          })
          .returning();
        return created({ project: inserted[0] });
      }

      case "carousel": {
        const title = str(body.title);
        if (!title) return badRequest("Carousel item title is required.", { title: "Required" });
        const inserted = await db
          .insert(carouselItems)
          .values({
            title,
            category: str(body.category, "Reel"),
            description: str(body.description),
            duration: str(body.duration, "0:30"),
            videoUrl: str(body.videoUrl),
            videoSource: str(body.videoSource, "upload"),
            thumbnailUrl: str(body.thumbnailUrl),
            aspectRatio: str(body.aspectRatio, "9:16"),
            isActive: "isActive" in body ? bool(body.isActive) : true,
            sortOrder: num(body.sortOrder) ?? 0,
            projectId: num(body.projectId),
          })
          .returning();
        return created({ item: inserted[0] });
      }

      case "media": {
        const filename = str(body.filename);
        const url = str(body.url);
        if (!filename || !url) return badRequest("Filename and URL are required.");
        const inserted = await db
          .insert(mediaFiles)
          .values({
            filename,
            originalName: str(body.originalName, filename),
            mimeType: str(body.mimeType, "image/jpeg"),
            kind: str(body.kind, "image"),
            size: num(body.size) ?? 0,
            url,
            width: num(body.width),
            height: num(body.height),
          })
          .returning();
        return created({ media: inserted[0] });
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
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("categories").catch(() => 0)),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ category: inserted[0] });
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
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("skills").catch(() => 0)),
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
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("software_tools").catch(() => 0)),
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
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("services").catch(() => 0)),
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
            sortOrder: num(body.sortOrder) ?? (await nextSortOrder("work_options").catch(() => 0)),
            isActive: "isActive" in body ? bool(body.isActive) : true,
          })
          .returning();
        return created({ workOption: inserted[0] });
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
        if (!second) return badRequest("Missing project id.");
        const id = Number(second);
        const patch: Record<string, unknown> = { updatedAt: new Date() };
        if ("title" in body) patch.title = str(body.title);
        if ("description" in body) patch.description = str(body.description);
        if ("categoryId" in body) patch.categoryId = num(body.categoryId);
        if ("categoryLabel" in body) patch.categoryLabel = str(body.categoryLabel);
        if ("aiLabType" in body) patch.aiLabType = str(body.aiLabType);
        if ("year" in body) patch.year = num(body.year);
        if ("software" in body) patch.software = str(body.software);
        if ("tags" in body) patch.tags = str(body.tags);
        if ("externalLink" in body) patch.externalLink = str(body.externalLink);
        if ("videoSource" in body) patch.videoSource = str(body.videoSource);
        if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
        if ("thumbnailUrl" in body) patch.thumbnailUrl = str(body.thumbnailUrl);
        if ("aspectRatio" in body) patch.aspectRatio = str(body.aspectRatio);
        if ("displaySize" in body) patch.displaySize = str(body.displaySize);
        if ("durationSeconds" in body) patch.durationSeconds = num(body.durationSeconds);
        if ("featured" in body) patch.featured = bool(body.featured);
        if ("published" in body) patch.published = bool(body.published);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder);
        const updated = await db
          .update(projects)
          .set(patch as Partial<typeof projects.$inferInsert>)
          .where(eq(projects.id, id))
          .returning();
        return ok({ project: await one(updated) });
      }

      case "carousel": {
        if (!second) return badRequest("Missing carousel item id.");
        const id = Number(second);
        const patch: Record<string, unknown> = { updatedAt: new Date() };
        if ("title" in body) patch.title = str(body.title);
        if ("category" in body) patch.category = str(body.category);
        if ("description" in body) patch.description = str(body.description);
        if ("duration" in body) patch.duration = str(body.duration);
        if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
        if ("thumbnailUrl" in body) patch.thumbnailUrl = str(body.thumbnailUrl);
        if ("aspectRatio" in body) patch.aspectRatio = str(body.aspectRatio);
        if ("isActive" in body) patch.isActive = bool(body.isActive);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder);
        const updated = await db
          .update(carouselItems)
          .set(patch as Partial<typeof carouselItems.$inferInsert>)
          .where(eq(carouselItems.id, id))
          .returning();
        return ok({ item: await one(updated) });
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
          const existing = await db.select().from(homepageSettings).limit(1);
          if (!existing[0]) {
            const inserted = await db.insert(homepageSettings).values({ id: 1, ...patch }).returning();
            return ok({ settings: inserted[0] });
          }
          const updated = await db
            .update(homepageSettings)
            .set(patch)
            .where(eq(homepageSettings.id, existing[0].id))
            .returning();
          return ok({ settings: updated[0] });
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
          const existing = await db.select().from(contactSettings).limit(1);
          if (!existing[0]) {
            const inserted = await db.insert(contactSettings).values({ id: 1, ...patch }).returning();
            return ok({ settings: inserted[0] });
          }
          const updated = await db
            .update(contactSettings)
            .set(patch)
            .where(eq(contactSettings.id, existing[0].id))
            .returning();
          return ok({ settings: updated[0] });
        }

        if (second === "notifications") {
          const patch: Partial<typeof notificationSettings.$inferInsert> = { updatedAt: now };
          if ("emailEnabled" in body) patch.emailEnabled = bool(body.emailEnabled);
          if ("notificationEmail" in body) patch.notificationEmail = str(body.notificationEmail).toLowerCase();
          if ("adminStatus" in body) patch.adminStatus = str(body.adminStatus, "offline") === "online" ? "online" : "offline";
          if ("aiAutoReply" in body) patch.aiAutoReply = bool(body.aiAutoReply);

          const existing = await db.select().from(notificationSettings).limit(1);
          if (!existing[0]) {
            const inserted = await db.insert(notificationSettings).values({ id: 1, ...patch }).returning();
            return ok({ settings: inserted[0] });
          }
          const updated = await db.update(notificationSettings).set(patch).where(eq(notificationSettings.id, existing[0].id)).returning();
          return ok({ settings: updated[0] });
        }

        if (second === "theme") {
          const patch: Partial<typeof themeSettings.$inferInsert> = { updatedAt: now };
          if ("activeTheme" in body) patch.activeTheme = str(body.activeTheme, "theme01") || "theme01";
          if ("accent" in body) patch.accent = str(body.accent, "#e0147f") || "#e0147f";
          if ("fontPairing" in body) patch.fontPairing = str(body.fontPairing, "default") || "default";
          if ("borderRadius" in body) patch.borderRadius = str(body.borderRadius, "rounded") || "rounded";
          if ("animationSpeed" in body) patch.animationSpeed = str(body.animationSpeed, "normal") || "normal";
          if ("cursorEffect" in body) patch.cursorEffect = bool(body.cursorEffect);
          if ("glassOpacity" in body)
            patch.glassOpacity = Math.min(Math.max(num(body.glassOpacity) ?? 45, 0), 100);
          if ("glassBlur" in body)
            patch.glassBlur = Math.min(Math.max(num(body.glassBlur) ?? 20, 0), 40);
          if ("grain" in body) patch.grain = bool(body.grain);

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
            return ok({ adminStatus: inserted[0]?.adminStatus || "offline", aiAutoReply: inserted[0]?.aiAutoReply !== false });
          }
          const updated = await db.update(notificationSettings).set(patch).where(eq(notificationSettings.id, existing[0].id)).returning();
          return ok({ adminStatus: updated[0]?.adminStatus || "offline", aiAutoReply: updated[0]?.aiAutoReply !== false });
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

    try {
      switch (resource) {
        case "projects":
          await db.delete(projects).where(eq(projects.id, id));
          return ok({ deleted: id });
        case "carousel":
          await db.delete(carouselItems).where(eq(carouselItems.id, id));
          return ok({ deleted: id });
        case "media":
          await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
          return ok({ deleted: id });
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
    } catch {
      return ok({ deleted: id });
    }
  });
}
