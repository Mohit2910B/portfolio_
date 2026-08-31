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
  carouselGlobalSettings,
  carouselItems,
} from "@/db/schema";
import {
  ensureDatabase,
  CATEGORY_SEED,
  SERVICE_SEED,
  SKILL_SEED,
  SOFTWARE_TOOL_SEED,
  WORK_OPTION_SEED,
} from "@/lib/bootstrap";
import {
  HOME_FALLBACK,
  CONTACT_FALLBACK,
  DEFAULT_CAROUSEL_GLOBAL_SETTINGS,
  DEFAULT_CAROUSEL_ITEMS,
  DEFAULT_CATEGORIES,
  DEFAULT_PROJECTS,
  DEFAULT_SERVICES,
  DEFAULT_SOFTWARE_TOOLS,
  DEFAULT_WORK_OPTIONS,
  DEFAULT_SECTIONS,
  invalidateSiteDataCache,
  setRuntimeOverride,
  getRuntimeOverride,
} from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { badRequest, created, guard, notFound, num, ok, str, bool } from "@/lib/http";
import { deleteStoredFile, safeStoredName } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path?: string[] }> };
type ProjectInsert = typeof projects.$inferInsert;

function revalidatePublic() {
  try {
    invalidateSiteDataCache();
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
  if ("carouselEnabled" in body) patch.carouselEnabled = bool(body.carouselEnabled);
  if ("carouselPinned" in body) patch.carouselPinned = bool(body.carouselPinned);
  if ("carouselOrder" in body) patch.carouselOrder = num(body.carouselOrder) ?? 0;
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
  if ("isActive" in body) patch.isActive = body.isActive === true || body.isActive === "true";

  const id = num(body.id);
  if (!id) throw badRequest("Missing record id.");

  try {
    if (table === "categories") {
      const curCats = getRuntimeOverride("allCategories") || DEFAULT_CATEGORIES;
      const updatedCats = curCats.map((c) => (c.id === id ? { ...c, ...patch } : c));
      setRuntimeOverride("allCategories", updatedCats as typeof DEFAULT_CATEGORIES);
      setRuntimeOverride("categories", updatedCats.filter((c) => (c as { isActive?: boolean }).isActive !== false) as typeof DEFAULT_CATEGORIES);

      try {
        const updated = await db
          .update(categories)
          .set(patch as Partial<typeof categories.$inferInsert>)
          .where(eq(categories.id, id))
          .returning();
        return ok({ record: updated[0] || { id, ...patch } });
      } catch {
        return ok({ record: { id, ...patch } });
      }
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
              isActive: r.isActive !== false,
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
        return ok({ media: [] });

      case "carousel": {
        let globalSettings = getRuntimeOverride("carouselGlobalSettings") || DEFAULT_CAROUSEL_GLOBAL_SETTINGS;
        try {
          const rows = await db.select().from(carouselGlobalSettings).limit(1);
          if (rows[0]) {
            globalSettings = {
              id: rows[0].id,
              enabled: rows[0].enabled !== false,
              sectionBadge: rows[0].sectionBadge || "VIDEO SHOWCASE",
              sectionTitle: rows[0].sectionTitle || "SELECTED WORKS",
              sectionSubtitle:
                rows[0].sectionSubtitle ||
                "A curated showcase of video editing, motion design, and visual storytelling.",
              textColor: rows[0].textColor || "black",
              autoplay: rows[0].autoplay !== false,
              autoplaySpeed: rows[0].autoplaySpeed || 5,
              infiniteLoop: rows[0].infiniteLoop !== false,
              showArrows: rows[0].showArrows !== false,
              showDots: rows[0].showDots !== false,
              updatedAt: rows[0].updatedAt || new Date(),
            };
          }
        } catch {}

        let items: any[] = [];
        try {
          items = await db
            .select()
            .from(carouselItems)
            .orderBy(asc(carouselItems.sortOrder), asc(carouselItems.id));
          if (items.length === 0) {
            items = DEFAULT_CAROUSEL_ITEMS;
          }
        } catch {
          items = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
        }

        let categoryList: any[] = [];
        try {
          categoryList = await db
            .select()
            .from(categories)
            .where(eq(categories.isActive, true))
            .orderBy(asc(categories.sortOrder));
        } catch {}

        return ok({
          globalSettings,
          items,
          categories: categoryList,
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

      case "carousel": {
        const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
        const curGlobal = getRuntimeOverride("carouselGlobalSettings") || DEFAULT_CAROUSEL_GLOBAL_SETTINGS;
        const curCategories = getRuntimeOverride("allCategories") || DEFAULT_CATEGORIES;

        if (second === "global") {
          try {
            const rows = await db.select().from(carouselGlobalSettings).limit(1);
            return ok({ global: rows[0] || curGlobal });
          } catch {
            return ok({ global: curGlobal });
          }
        }

        if (second === "item" && third) {
          const id = Number(third);
          try {
            const rows = await db.select().from(carouselItems).where(eq(carouselItems.id, id)).limit(1);
            if (rows[0]) return ok({ item: rows[0] });
          } catch {}
          const it = curItems.find((i) => i.id === id);
          return ok({ item: it || null });
        }

        try {
          const [itemRows, globalRows, catRows] = await Promise.all([
            db.select().from(carouselItems).orderBy(asc(carouselItems.sortOrder), asc(carouselItems.id)),
            db.select().from(carouselGlobalSettings).limit(1),
            db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
          ]);
          return ok({
            items: itemRows.length > 0 ? itemRows : curItems,
            global: globalRows[0] || curGlobal,
            categories: catRows.length > 0 ? catRows : curCategories,
          });
        } catch {
          return ok({
            items: curItems,
            global: curGlobal,
            categories: curCategories,
          });
        }
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
          const notif = globalThis.__runtimeSiteDataOverrides?.notificationSettings;
          return ok({
            adminStatus: notif?.adminStatus || "offline",
            aiAutoReply: notif?.aiAutoReply !== false,
          });
        }
        if (second !== "conversations") throw notFound("Unknown chat resource.");
        if (!third) {
          const store = (await import("@/lib/chat")).getRuntimeChatStore();
          const storeConvos = Array.from(store.conversations.values());
          try {
            const rows = await db
              .select()
              .from(chatConversations)
              .orderBy(desc(chatConversations.updatedAt));
            const now = Date.now();
            const mergedMap = new Map<number, (typeof rows)[0] & { online?: boolean }>();
            for (const c of storeConvos) {
              mergedMap.set(c.id, {
                ...c,
                online: Boolean(c.customerSeenAt && now - new Date(c.customerSeenAt).getTime() < 3 * 60 * 1000),
              } as unknown as (typeof rows)[0] & { online?: boolean });
            }
            for (const r of rows) {
              mergedMap.set(r.id, {
                ...r,
                online: Boolean(r.customerSeenAt && now - new Date(r.customerSeenAt).getTime() < 3 * 60 * 1000),
              });
            }
            const allConvos = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
            return ok({ conversations: allConvos });
          } catch {
            const now = Date.now();
            return ok({
              conversations: storeConvos.map((c) => ({
                ...c,
                online: Boolean(c.customerSeenAt && now - new Date(c.customerSeenAt).getTime() < 3 * 60 * 1000),
              })),
            });
          }
        }
        const id = Number(third);
        const store = (await import("@/lib/chat")).getRuntimeChatStore();
        let conversation = store.conversations.get(id) || null;
        let messages = store.messages.get(id) || [];

        try {
          const rows = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
          if (rows[0]) conversation = rows[0];
          const dbMsgs = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.conversationId, id))
            .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
          if (dbMsgs.length > 0) messages = dbMsgs;
          await db
            .update(chatMessages)
            .set({ isRead: true })
            .where(
              sql`${chatMessages.conversationId} = ${id} and ${chatMessages.senderType} = 'customer' and ${chatMessages.isRead} = false`,
            );
          await db.update(chatConversations).set({ adminUnread: 0 }).where(eq(chatConversations.id, id));
        } catch {}

        if (!conversation) throw notFound("Conversation not found.");
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
            categories: DEFAULT_CATEGORIES.length,
            skills: SKILL_SEED.length,
            services: DEFAULT_SERVICES.length,
            softwareTools: DEFAULT_SOFTWARE_TOOLS.length,
          });
        case "projects":
          return ok({ projects: getRuntimeOverride("projects") || DEFAULT_PROJECTS });
        case "categories":
          return ok({
            categories: (getRuntimeOverride("allCategories") || DEFAULT_CATEGORIES).map((c, i) => ({
              ...c,
              projectCount: 0,
            })),
          });
        case "services":
          return ok({ services: getRuntimeOverride("services") || DEFAULT_SERVICES });
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
          return ok({ softwareTools: getRuntimeOverride("softwareTools") || DEFAULT_SOFTWARE_TOOLS });
        case "work-options":
          return ok({ workOptions: getRuntimeOverride("workOptions") || DEFAULT_WORK_OPTIONS });
        case "media":
          return ok({ media: [] });
        case "carousel":
          return ok({
            globalSettings: getRuntimeOverride("carouselGlobalSettings") || DEFAULT_CAROUSEL_GLOBAL_SETTINGS,
            items: getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS,
          });
        case "settings":
          if (second === "homepage") {
            return ok({ settings: getRuntimeOverride("homepage") || HOME_FALLBACK });
          }
          if (second === "theme") {
            return ok({
              settings: getRuntimeOverride("theme") || {
                id: 1,
                activeTheme: "theme01",
                accent: "#e0147f",
                fontPairing: "default",
                borderRadius: "rounded",
                animationSpeed: "normal",
                cursorEffect: true,
                glassOpacity: 45,
                glassBlur: 20,
                grain: true,
                updatedAt: new Date(),
              },
            });
          }
          if (second === "contact") {
            return ok({ settings: getRuntimeOverride("contact") || CONTACT_FALLBACK });
          }
          if (second === "notifications") {
            return ok({
              settings: globalThis.__runtimeSiteDataOverrides?.notificationSettings || {
                id: 1,
                emailEnabled: true,
                notificationEmail:
                  process.env.NOTIFICATION_EMAIL ||
                  process.env.SEED_ADMIN_EMAIL ||
                  "mohitbabariyaa@gmail.com",
                adminStatus: "offline",
                aiAutoReply: true,
              },
            });
          }
          return ok({ settings: {} });
        case "layout":
          return ok({ sections: getRuntimeOverride("sections") || DEFAULT_SECTIONS });
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
        patch.categoryLabel = await categoryLabelFor(patch.categoryId).catch(() => "");
        patch.sortOrder = patch.sortOrder ?? (await nextSortOrder("projects").catch(() => 0));
        let createdProject: typeof patch & { id: number } = { id: Date.now(), ...patch };
        try {
          const inserted = await db.insert(projects).values(patch as ProjectInsert).returning();
          if (inserted[0]) createdProject = inserted[0] as typeof createdProject;
        } catch {}

        const curProjs = getRuntimeOverride("projects") || DEFAULT_PROJECTS;
        const mappedCreated = {
          id: createdProject.id,
          title: createdProject.title || "",
          description: createdProject.description || "",
          categoryId: createdProject.categoryId || 1,
          categoryLabel: createdProject.categoryLabel || "",
          aiLabType: createdProject.aiLabType || "",
          year: createdProject.year || 2026,
          software: createdProject.software || "",
          tags: createdProject.tags || "",
          externalLink: createdProject.externalLink || "",
          videoUrl: createdProject.videoUrl || "",
          videoSource: createdProject.videoSource || "upload",
          thumbnailUrl: createdProject.thumbnailUrl || "",
          aspectRatio: createdProject.aspectRatio || "9:16",
          displaySize: createdProject.displaySize || "medium",
          displayWidth: createdProject.displayWidth || 540,
          displayHeight: createdProject.displayHeight || 960,
          width: createdProject.width || 1080,
          height: createdProject.height || 1920,
          durationSeconds: createdProject.durationSeconds || 30,
          featured: createdProject.featured ?? true,
          published: createdProject.published ?? true,
          demoStatus: createdProject.demoStatus || "verified",
          sortOrder: createdProject.sortOrder ?? 0,
          carouselEnabled: createdProject.carouselEnabled ?? true,
        };
        setRuntimeOverride("projects", [mappedCreated, ...curProjs.filter((p) => p.id !== mappedCreated.id)] as typeof DEFAULT_PROJECTS);
        return created({ project: createdProject });
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
        try {
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
          const category = inserted[0];
          return created({ category });
        } catch {
          return created({
            category: {
              id: Date.now(),
              name,
              slug: str(body.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              description: str(body.description),
              sortOrder: 0,
              isActive: true,
            },
          });
        }
      }

      case "carousel": {
        if (second === "reorder") {
          const id = Number(body.id);
          const dir = str(body.direction, "up");
          const curItems = [...(getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS)];
          const idx = curItems.findIndex((i) => i.id === id);
          if (idx !== -1) {
            const targetIdx = dir === "up" ? idx - 1 : idx + 1;
            if (targetIdx >= 0 && targetIdx < curItems.length) {
              const temp = curItems[idx];
              curItems[idx] = curItems[targetIdx];
              curItems[targetIdx] = temp;
              curItems.forEach((it, i) => { it.sortOrder = i; });
              setRuntimeOverride("carouselItems", curItems as typeof DEFAULT_CAROUSEL_ITEMS);
            }
          }
          return ok({ reordered: true });
        }

        const title = str(body.title);
        const category = str(body.category);
        if (!title) return badRequest("Title is required.");

        const newItem = {
          id: Date.now(),
          title,
          category: category || "Reel",
          description: str(body.description),
          duration: str(body.duration, "0:30"),
          videoUrl: str(body.videoUrl),
          videoSource: str(body.videoSource, "upload"),
          thumbnailUrl: str(body.thumbnailUrl),
          aspectRatio: (str(body.aspectRatio, "9:16") as "9:16" | "4:5" | "16:9" | "1:1") || "9:16",
          isActive: body.isActive !== false,
          sortOrder: num(body.sortOrder) ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
        setRuntimeOverride("carouselItems", [...curItems, newItem] as typeof DEFAULT_CAROUSEL_ITEMS);

        try {
          const inserted = await db.insert(carouselItems).values({
            title: newItem.title,
            category: newItem.category,
            description: newItem.description,
            duration: newItem.duration,
            videoUrl: newItem.videoUrl,
            videoSource: newItem.videoSource,
            thumbnailUrl: newItem.thumbnailUrl,
            aspectRatio: newItem.aspectRatio,
            isActive: newItem.isActive,
            sortOrder: newItem.sortOrder,
          }).returning();
          if (inserted[0]) return created({ item: inserted[0] });
        } catch {}

        return created({ item: newItem });
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
        try {
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
        } catch {
          return created({
            skill: {
              id: Date.now(),
              name,
              category: str(body.category),
              description: str(body.description),
              level: num(body.level),
              sortOrder: 0,
              isActive: true,
            },
          });
        }
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
        try {
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
        } catch {
          return created({
            softwareTool: {
              id: Date.now(),
              name,
              category: str(body.category),
              icon: str(body.icon, "generic") || "generic",
              proficiency: num(body.proficiency),
              sortOrder: 0,
              isActive: true,
            },
          });
        }
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
        try {
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
        } catch {
          return created({
            service: {
              id: Date.now(),
              title,
              description: str(body.description),
              deliverables: str(body.deliverables),
              icon: str(body.icon),
              priceFrom: str(body.priceFrom),
              sortOrder: 0,
              isActive: true,
            },
          });
        }
      }

      case "work-options": {
        const label = str(body.label);
        if (!label) return badRequest("Label is required.", { label: "Required" });
        try {
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
        } catch {
          return created({
            workOption: {
              id: Date.now(),
              label,
              value: str(body.value) || label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              sortOrder: 0,
              isActive: true,
            },
          });
        }
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
          const items = Array.isArray(body.items) ? body.items : [];
          try {
            for (const item of items) {
              const id = Number(item.id);
              if (Number.isInteger(id)) {
                await db
                  .update(carouselItems)
                  .set({
                    sortOrder: num(item.sortOrder) ?? 0,
                    isActive: "isActive" in item ? bool(item.isActive) : true,
                    updatedAt: new Date(),
                  })
                  .where(eq(carouselItems.id, id));
              }
            }
          } catch {}
          return ok({ success: true, count: items.length });
        }

        const title = str(body.title);
        if (!title) return badRequest("Item title is required.", { title: "Required" });
        const category = str(body.category) || "Video Edit";
        const description = str(body.description);
        const duration = str(body.duration);
        const videoUrl = str(body.videoUrl);
        const videoSource = str(body.videoSource, "upload") === "url" ? "url" : "upload";
        const thumbnailUrl = str(body.thumbnailUrl);
        const aspectRatio = str(body.aspectRatio, "9:16") || "9:16";
        const isActive = "isActive" in body ? bool(body.isActive) : true;
        const sortOrder = num(body.sortOrder) ?? 0;
        const projectId = num(body.projectId);

        let createdItem: typeof DEFAULT_CAROUSEL_ITEMS[0] = {
          id: Date.now(),
          title,
          category,
          description,
          duration,
          videoUrl,
          videoSource,
          thumbnailUrl,
          aspectRatio,
          isActive,
          sortOrder,
          projectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          const inserted = await db
            .insert(carouselItems)
            .values({
              title,
              category,
              description,
              duration,
              videoUrl,
              videoSource,
              thumbnailUrl,
              aspectRatio,
              isActive,
              sortOrder,
              projectId,
            })
            .returning();
          if (inserted[0]) createdItem = inserted[0] as typeof createdItem;
        } catch {}

        const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
        setRuntimeOverride("carouselItems", [...curItems.filter((i) => i.id !== createdItem.id), createdItem] as typeof DEFAULT_CAROUSEL_ITEMS);
        return created({ item: createdItem });
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

          const curProjs = getRuntimeOverride("projects") || DEFAULT_PROJECTS;
          const updatedList = curProjs.map((p) => (p.id === id ? { ...p, ...patch } : p));
          setRuntimeOverride("projects", updatedList as typeof DEFAULT_PROJECTS);

          try {
            const updated = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
            return ok({ project: await one(updated) });
          } catch {
            return ok({ project: { id, ...patch } });
          }
        }

        const patch = parseProjectBody(body);
        if (patch.categoryId !== undefined) {
          patch.categoryLabel = await categoryLabelFor(patch.categoryId).catch(() => "");
        }
        if (Object.keys(patch).length === 0) return badRequest("Nothing to update.");
        patch.updatedAt = new Date();

        const curProjs = getRuntimeOverride("projects") || DEFAULT_PROJECTS;
        const updatedList = curProjs.map((p) => (p.id === id ? { ...p, ...patch } : p));
        setRuntimeOverride("projects", updatedList as typeof DEFAULT_PROJECTS);

        try {
          const updated = await db.update(projects).set(patch).where(eq(projects.id, id)).returning();
          return ok({ project: await one(updated) });
        } catch {
          return ok({ project: { id, ...patch } });
        }
      }

      case "carousel": {
        if (second === "global") {
          const patch: Partial<typeof carouselGlobalSettings.$inferInsert> = { updatedAt: new Date() };
          if ("enabled" in body) patch.enabled = bool(body.enabled);
          if ("sectionBadge" in body) patch.sectionBadge = str(body.sectionBadge);
          if ("sectionTitle" in body) patch.sectionTitle = str(body.sectionTitle);
          if ("sectionSubtitle" in body) patch.sectionSubtitle = str(body.sectionSubtitle);
          if ("autoplay" in body) patch.autoplay = bool(body.autoplay);
          if ("autoplaySpeed" in body) patch.autoplaySpeed = num(body.autoplaySpeed) ?? 5;
          if ("infiniteLoop" in body) patch.infiniteLoop = bool(body.infiniteLoop);
          if ("showArrows" in body) patch.showArrows = bool(body.showArrows);
          if ("showDots" in body) patch.showDots = bool(body.showDots);

          const curGlobal = getRuntimeOverride("carouselGlobalSettings") || DEFAULT_CAROUSEL_GLOBAL_SETTINGS;
          const mergedGlobal = { ...curGlobal, ...patch };
          setRuntimeOverride("carouselGlobalSettings", mergedGlobal as typeof DEFAULT_CAROUSEL_GLOBAL_SETTINGS);

          try {
            const existing = await db.select().from(carouselGlobalSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db.insert(carouselGlobalSettings).values({ id: 1, ...patch }).returning();
              return ok({ global: inserted[0] });
            }
            const updated = await db.update(carouselGlobalSettings).set(patch).where(eq(carouselGlobalSettings.id, existing[0].id)).returning();
            return ok({ global: updated[0] });
          } catch {
            return ok({ global: mergedGlobal });
          }
        }

        const id = Number(second === "item" ? third : second);
        if (!Number.isInteger(id)) return badRequest("Invalid carousel item id.");

        const patch: Record<string, unknown> = { updatedAt: new Date() };
        if ("title" in body) patch.title = str(body.title);
        if ("category" in body) patch.category = str(body.category);
        if ("description" in body) patch.description = str(body.description);
        if ("duration" in body) patch.duration = str(body.duration);
        if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
        if ("videoSource" in body) patch.videoSource = str(body.videoSource);
        if ("thumbnailUrl" in body) patch.thumbnailUrl = str(body.thumbnailUrl);
        if ("aspectRatio" in body) patch.aspectRatio = str(body.aspectRatio);
        if ("isActive" in body) patch.isActive = bool(body.isActive);
        if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;

        const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
        const updatedList = curItems.map((i) => (i.id === id ? { ...i, ...patch } : i));
        setRuntimeOverride("carouselItems", updatedList as typeof DEFAULT_CAROUSEL_ITEMS);

        try {
          const updated = await db.update(carouselItems).set(patch).where(eq(carouselItems.id, id)).returning();
          return ok({ item: updated[0] || { id, ...patch } });
        } catch {
          return ok({ item: { id, ...patch } });
        }
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
        try {
          const updated = await db
            .update(softwareTools)
            .set(patch)
            .where(eq(softwareTools.id, id))
            .returning();
          return ok({ softwareTool: await one(updated) });
        } catch {
          return ok({ softwareTool: { id, ...patch } });
        }
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
        if (second === "settings") {
          const patch: Partial<typeof carouselGlobalSettings.$inferInsert> = { updatedAt: new Date() };
          if ("enabled" in body) patch.enabled = bool(body.enabled);
          if ("sectionBadge" in body) patch.sectionBadge = str(body.sectionBadge);
          if ("sectionTitle" in body) patch.sectionTitle = str(body.sectionTitle);
          if ("sectionSubtitle" in body) patch.sectionSubtitle = str(body.sectionSubtitle);
          if ("textColor" in body) patch.textColor = str(body.textColor, "black");
          if ("autoplay" in body) patch.autoplay = bool(body.autoplay);
          if ("autoplaySpeed" in body) patch.autoplaySpeed = Math.max(num(body.autoplaySpeed) ?? 5, 1);
          if ("infiniteLoop" in body) patch.infiniteLoop = bool(body.infiniteLoop);
          if ("showArrows" in body) patch.showArrows = bool(body.showArrows);
          if ("showDots" in body) patch.showDots = bool(body.showDots);

          const currentOverride =
            getRuntimeOverride("carouselGlobalSettings") || DEFAULT_CAROUSEL_GLOBAL_SETTINGS;
          const merged = { ...currentOverride, ...patch };
          setRuntimeOverride(
            "carouselGlobalSettings",
            merged as typeof DEFAULT_CAROUSEL_GLOBAL_SETTINGS,
          );

          try {
            const existing = await db.select().from(carouselGlobalSettings).limit(1);
            if (!existing[0]) {
              const inserted = await db
                .insert(carouselGlobalSettings)
                .values({ id: 1, ...patch })
                .returning();
              return ok({ globalSettings: inserted[0] });
            }
            const updated = await db
              .update(carouselGlobalSettings)
              .set(patch)
              .where(eq(carouselGlobalSettings.id, existing[0].id))
              .returning();
            return ok({ globalSettings: updated[0] });
          } catch {
            return ok({ globalSettings: merged });
          }
        }

        if (second === "reorder") {
          const items = Array.isArray(body.items) ? body.items : [];
          try {
            for (const item of items) {
              const id = Number(item.id);
              if (Number.isInteger(id)) {
                await db
                  .update(carouselItems)
                  .set({
                    sortOrder: num(item.sortOrder) ?? 0,
                    isActive: "isActive" in item ? bool(item.isActive) : true,
                    updatedAt: new Date(),
                  })
                  .where(eq(carouselItems.id, id));
              }
            }
          } catch {}
          return ok({ success: true, count: items.length });
        }

        const itemId = Number(second === "item" && third ? third : second);
        if (Number.isInteger(itemId) && itemId > 0) {
          const patch: Partial<typeof carouselItems.$inferInsert> = { updatedAt: new Date() };
          if ("title" in body) patch.title = str(body.title);
          if ("category" in body) patch.category = str(body.category);
          if ("description" in body) patch.description = str(body.description);
          if ("duration" in body) patch.duration = str(body.duration);
          if ("videoUrl" in body) patch.videoUrl = str(body.videoUrl);
          if ("videoSource" in body) patch.videoSource = str(body.videoSource, "upload") === "url" ? "url" : "upload";
          if ("thumbnailUrl" in body) patch.thumbnailUrl = str(body.thumbnailUrl);
          if ("aspectRatio" in body) patch.aspectRatio = str(body.aspectRatio, "9:16");
          if ("isActive" in body) patch.isActive = bool(body.isActive);
          if ("sortOrder" in body) patch.sortOrder = num(body.sortOrder) ?? 0;
          if ("projectId" in body) patch.projectId = num(body.projectId);

          const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
          const updatedItems = curItems.map((i) => (i.id === itemId ? { ...i, ...patch } : i));
          setRuntimeOverride("carouselItems", updatedItems as typeof DEFAULT_CAROUSEL_ITEMS);

          try {
            const updated = await db
              .update(carouselItems)
              .set(patch)
              .where(eq(carouselItems.id, itemId))
              .returning();
            return ok({ item: updated[0] });
          } catch {
            return ok({ item: { id: itemId, ...patch } });
          }
        }

        return badRequest("Unknown carousel action.");
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

          const currentTheme = getRuntimeOverride("theme") || {
            id: 1,
            activeTheme: "theme01",
            accent: "#e0147f",
            fontPairing: "default",
            borderRadius: "rounded",
            animationSpeed: "normal",
            cursorEffect: true,
            glassOpacity: 45,
            glassBlur: 20,
            grain: true,
            updatedAt: new Date(),
          };
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
              return ok({ adminStatus: inserted[0]?.adminStatus || "offline", aiAutoReply: inserted[0]?.aiAutoReply !== false });
            }
            const updated = await db.update(notificationSettings).set(patch).where(eq(notificationSettings.id, existing[0].id)).returning();
            return ok({ adminStatus: updated[0]?.adminStatus || "offline", aiAutoReply: updated[0]?.aiAutoReply !== false });
          } catch {
            return ok({ adminStatus: mergedNotif.adminStatus, aiAutoReply: mergedNotif.aiAutoReply });
          }
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
        case "projects": {
          const curProjs = getRuntimeOverride("projects") || DEFAULT_PROJECTS;
          setRuntimeOverride("projects", curProjs.filter((p) => p.id !== id) as typeof DEFAULT_PROJECTS);
          const project = await one(
            await db.select().from(projects).where(eq(projects.id, id)).limit(1),
          );
          await db.delete(projects).where(eq(projects.id, id));
          if (project?.videoUrl) await deleteStoredFile(project.videoUrl);
          if (project?.thumbnailUrl) await deleteStoredFile(project.thumbnailUrl);
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
        case "media":
          return ok({ deleted: id });
        case "carousel": {
          const curItems = getRuntimeOverride("carouselItems") || DEFAULT_CAROUSEL_ITEMS;
          setRuntimeOverride("carouselItems", curItems.filter((i) => i.id !== id) as typeof DEFAULT_CAROUSEL_ITEMS);
          const item = await one(
            await db.select().from(carouselItems).where(eq(carouselItems.id, id)).limit(1),
          );
          await db.delete(carouselItems).where(eq(carouselItems.id, id));
          if (item?.videoUrl) await deleteStoredFile(item.videoUrl);
          if (item?.thumbnailUrl) await deleteStoredFile(item.thumbnailUrl);
          return ok({ deleted: id });
        }
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
