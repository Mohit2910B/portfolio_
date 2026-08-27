import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  carouselSettings,
  categories,
  contactSettings,
  homepageSettings,
  layoutSections,
  projects,
  services,
  skills,
  softwareTools,
  themeSettings,
  workOptions,
  notificationSettings,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";

let bootstrapped = false;

async function count(table: string): Promise<number> {
  const allowedTables = [
    "admins",
    "categories",
    "projects",
    "services",
    "skills",
    "inquiries",
    "site_settings",
    "chat_conversations",
    "chat_messages",
    "conversations",
    "software_tools",
    "work_options",
    "layout_sections",
    "homepage_settings",
    "contact_settings",
    "theme_settings",
    "carousel_settings",
  ];

  if (!allowedTables.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }

 const result = await db.execute(
  sql.raw(`SELECT COUNT(*) AS c FROM "${table}"`),
);

  const rows = Array.isArray(result)
    ? result[0]
    : (result as { rows?: unknown[] }).rows;

  const firstRow = Array.isArray(rows) ? rows[0] : undefined;

  if (!firstRow || typeof firstRow !== "object") {
    return 0;
  }

  const value = (firstRow as { c?: string | number }).c;

  return Number(value ?? 0);
}
async function seedAdmin() {
  if ((await count("admins")) > 0) return;
  const name = process.env.SEED_ADMIN_NAME || "Mohit Babariya";
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@mohitbabariya.studio").toLowerCase();
  const username = process.env.SEED_ADMIN_USERNAME || "mohit";
  const password = process.env.SEED_ADMIN_PASSWORD || "Mohit@2026";
  const { admins } = await import("@/db/schema");
  await db.insert(admins).values({
    name,
    email,
    username,
    passwordHash: await hashPassword(password),
    role: "owner",
  });
}

const CATEGORY_SEED = [
  ["Real Estate", "Property walk-throughs, listing films and cinematic tours."],
  ["Instagram", "Reels, vertical edits and scroll-stopping social cuts."],
  ["YouTube", "Long-form edits, retention pacing and thumbnail systems."],
  ["Motion Graphics", "Kinetic type, animated branding and title systems."],
  ["Graphic Design", "Static design systems, thumbnails and brand layouts."],
  ["Product Video", "Product storytelling, feature demos and launch edits."],
  ["AI Video", "AI-assisted generation, upscaling and hybrid workflows."],
  ["Corporate", "Brand films, internal communication and event recaps."],
  ["Other", "Experiments, personal cuts and everything in between."],
] as const;

const SKILL_SEED = [
  ["Video Editing", "Post Production", "Narrative structure, pacing and rhythm across long and short form.", 95],
  ["Motion Graphics", "Motion", "Kinetic typography, animated logos, lower thirds and title systems.", 90],
  ["After Effects", "Tools", "Compositing, keyframing, expressions and plugin-driven workflows.", 92],
  ["Premiere Pro", "Tools", "Timeline-led editing, multicam, proxies and delivery pipelines.", 95],
  ["DaVinci Resolve", "Tools", "Node-based colour work, conform and finishing.", 88],
  ["Color Grading", "Craft", "Look development, shot matching and cinematic tone shaping.", 90],
  ["AI Video", "Craft", "AI-assisted generation, cleanup, upscale and hybrid edit workflows.", 85],
  ["Sound Design", "Craft", "Music selection, SFX layering, dialogue cleanup and final mix.", 80],
  ["Social Media Editing", "Distribution", "Hook-first cuts, captions, aspect ratio versions and platform specs.", 95],
  ["Creative Direction", "Strategy", "References, storyboards, edit styles and visual systems.", 88],
] as const;

const SOFTWARE_TOOL_SEED = [
  ["Adobe Premiere Pro", "Editing", "premiere", 95],
  ["Adobe After Effects", "Motion", "after-effects", 92],
  ["DaVinci Resolve", "Colour", "davinci", 88],
  ["Photoshop", "Design", "photoshop", 90],
  ["Illustrator", "Vector", "illustrator", 86],
  ["Blender", "3D / Visual Design", "blender", 78],
  ["CapCut", "Social Editing", "capcut", 88],
  ["Figma", "Design Systems", "figma", 82],
  ["AI / Generative AI tools", "AI Video", "ai", 85],
] as const;

const SERVICE_SEED = [
  {
    title: "Video Editing",
    description:
      "Timeline-led editing for brands, creators and studios â€” from raw footage to a finished master.",
    deliverables: "Story assembly|Rhythm & pacing|Subtitles|Multi-ratio delivery",
    icon: "cut",
  },
  {
    title: "Motion Graphics",
    description:
      "Animated typography, logo motion, lower thirds and graphic systems that carry a brand.",
    deliverables: "Kinetic type|Logo animation|Titles & LTH|Transitions",
    icon: "shape",
  },
  {
    title: "Graphic Design",
    description:
      "Thumbnails, key art, brand layouts and campaign assets built around a clear visual hierarchy.",
    deliverables: "Thumbnails|Key art|Brand layouts|Campaign sets",
    icon: "frame",
  },
  {
    title: "AI Video",
    description:
      "AI-assisted generation, enhancement and hybrid workflows blended into a normal edit pipeline.",
    deliverables: "AI generation|Cleanup & upscale|Voice & dubbing support|Hybrid edits",
    icon: "spark",
  },
  {
    title: "Colour Grading",
    description:
      "Look development and shot matching so every frame in a sequence belongs to the same world.",
    deliverables: "Primary & secondary|Shot matching|Look dev|Export masters",
    icon: "dial",
  },
  {
    title: "Social Media Editing",
    description:
      "Hook-first vertical edits designed for retention, delivered in every aspect ratio you need.",
    deliverables: "Reels & shorts|Hook design|Captions|Batch delivery",
    icon: "phone",
  },
] as const;

const WORK_OPTION_SEED = [
  "Video Editing",
  "Reels",
  "YouTube",
  "Real Estate",
  "Motion Graphics",
  "Graphic Design",
  "Product Video",
  "AI Video",
  "AI UGC",
  "Corporate",
  "Other",
] as const;

const SECTION_SEED = [
  ["hero", "Hero"],
  ["about", "About"],
  ["tools", "Tools & Software"],
  ["services", "Services"],
  ["work", "Work / Portfolio"],
  ["contact", "Contact & Enquiry"],
] as const;

type SeedProject = {
  title: string;
  description: string;
  category: string;
  software: string;
  tags: string;
  aspectRatio: string;
  displaySize: string;
  year: number;
  featured: boolean;
  demoStatus: string;
  videoUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  durationSeconds: number;
};

const PROJECT_SEED: SeedProject[] = [
  {
    title: "Concrete Light â€” Property Film",
    description:
      "A cinematic property tour cut to a slow build, with matched colour across daylight and dusk interiors.",
    category: "Real Estate",
    software: "Premiere Pro, DaVinci Resolve",
    tags: "property film,colour grade,cinematic",
    aspectRatio: "16:9",
    displaySize: "large",
    year: 2025,
    featured: true,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/39105109/16638114_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/39105109/aerial-view-architecture-cinematic-lighting-interior-design-39105109.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 13,
  },
  {
    title: "Interior Walkthrough Cut",
    description: "Space-led edit with architectural pacing, clean transitions and a warm neutral grade.",
    category: "Real Estate",
    software: "Premiere Pro",
    tags: "walkthrough,interior,tour",
    aspectRatio: "16:9",
    displaySize: "medium",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578546/7578546-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578546/apartment-at-home-business-buy-7578546.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 21,
  },
  {
    title: "Listing Reel â€” Vertical",
    description: "Hook-first vertical cut for social with captions, beat-matched cuts and clean type.",
    category: "Instagram",
    software: "After Effects, Premiere Pro",
    tags: "reel,vertical,social",
    aspectRatio: "9:16",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/15887293/15887293-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/15887293/pexels-photo-15887293.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 12,
  },
  {
    title: "Process Story â€” Long Form",
    description: "Long-form edit structured around interview beats with supporting b-roll and graphics.",
    category: "YouTube",
    software: "Premiere Pro, After Effects",
    tags: "youtube,long form,interview",
    aspectRatio: "16:9",
    displaySize: "medium",
    year: 2024,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578108/7578108-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578108/adult-agent-apartment-at-home-7578108.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 20,
  },
  {
    title: "Product Detail Study",
    description: "Macro product moments graded for texture, with motion-graphic callouts on key features.",
    category: "Product Video",
    software: "After Effects, DaVinci Resolve",
    tags: "product,macro,callouts",
    aspectRatio: "1:1",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "demo",
    videoUrl: "https://videos.pexels.com/video-files/15887297/15887297-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/15887297/pexels-photo-15887297.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 14,
  },
  {
    title: "Brand Motion System",
    description: "Animated identity elements â€” logo resolve, type behaviour and transition language.",
    category: "Motion Graphics",
    software: "After Effects",
    tags: "branding,motion system,titles",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2024,
    featured: false,
    demoStatus: "demo",
    videoUrl: "https://videos.pexels.com/video-files/7578117/7578117-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578117/administration-adult-agent-apartment-7578117.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 11,
  },
  {
    title: "Corporate Recap Edit",
    description: "Event recap assembled from multi-camera coverage with a clean corporate finish.",
    category: "Corporate",
    software: "Premiere Pro",
    tags: "corporate,event,multicam",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2024,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7348146/7348146-uhd_3840_2160_25fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7348146/pexels-photo-7348146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 12,
  },
  {
    title: "Studio Session Cut",
    description: "Documentary-styled session edit with natural sound design and soft contrast grade.",
    category: "Other",
    software: "Premiere Pro, DaVinci Resolve",
    tags: "documentary,sound design,grade",
    aspectRatio: "16:9",
    displaySize: "small",
    year: 2025,
    featured: false,
    demoStatus: "live",
    videoUrl: "https://videos.pexels.com/video-files/7578112/7578112-uhd_3840_2160_30fps.mp4",
    thumbnailUrl:
      "https://images.pexels.com/videos/7578112/adult-agent-apartment-at-home-7578112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    width: 3840,
    height: 2160,
    durationSeconds: 11,
  },
];

async function seedContent() {
  if ((await count("categories")) === 0) {
    await db.insert(categories).values(
      CATEGORY_SEED.map(([name, description], index) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  const categoryRows = await db.select().from(categories);
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c]));

  if ((await count("projects")) === 0) {
    await db.insert(projects).values(
      PROJECT_SEED.map((project, index) => {
        const category = categoryByName.get(project.category);
        return {
          title: project.title,
          description: project.description,
          categoryId: category?.id ?? null,
          categoryLabel: project.category,
          software: project.software,
          tags: project.tags,
          aspectRatio: project.aspectRatio,
          displaySize: project.displaySize,
          displayWidth: project.aspectRatio === "9:16" ? 540 : 1200,
          displayHeight: project.aspectRatio === "9:16" ? 960 : 675,
          year: project.year,
          sortOrder: index,
          featured: project.featured,
          published: true,
          demoStatus: project.demoStatus,
          videoSource: "url",
          videoUrl: project.videoUrl,
          thumbnailUrl: project.thumbnailUrl,
          width: project.width,
          height: project.height,
          durationSeconds: project.durationSeconds,
        };
      }),
    );
  }

  if ((await count("skills")) === 0) {
    await db.insert(skills).values(
      SKILL_SEED.map(([name, category, description, level], index) => ({
        name,
        category,
        description,
        level,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("software_tools")) === 0) {
    await db.insert(softwareTools).values(
      SOFTWARE_TOOL_SEED.map(([name, category, icon, proficiency], index) => ({
        name,
        category,
        icon,
        proficiency,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("services")) === 0) {
    await db.insert(services).values(
      SERVICE_SEED.map((service, index) => ({
        ...service,
        deliverables: service.deliverables,
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("work_options")) === 0) {
    await db.insert(workOptions).values(
      WORK_OPTION_SEED.map((label, index) => ({
        label,
        value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sortOrder: index,
        isActive: true,
      })),
    );
  }

  if ((await count("layout_sections")) === 0) {
    await db.insert(layoutSections).values(
      SECTION_SEED.map(([sectionKey, label], index) => ({
        sectionKey,
        label,
        sortOrder: index,
        isVisible: true,
      })),
    );
  }



  if ((await count("homepage_settings")) === 0) {
    await db.insert(homepageSettings).values({
      id: 1,
      ownerName: "Mohit Babariya",
      heroName: "MOHIT BABARIYA",
      heroTitle: "MAKE\nVISUALS\nMOVE.",
      heroSubtitle: "VIDEO EDITOR Â· MOTION GRAPHICS Â· GRAPHIC DESIGN Â· AI VIDEO",
      heroDescription:
        "I edit films, reels and motion pieces that hold attention â€” clean cuts, considered pacing and a finish that feels intentional.",
      availabilityLabel: "Available for freelance projects",
      ctaPrimaryLabel: "WATCH REEL",
      ctaSecondaryLabel: "START PROJECT",
      reelUrl: "https://videos.pexels.com/video-files/39105109/16638114_3840_2160_30fps.mp4",
      aboutIntro:
        "I am Mohit Babariya, a video editor and motion designer working across editorial, social and brand content. My work sits between structure and feel â€” the timeline has to make sense, and it also has to move someone.",
      aboutExperience:
        "I work as an independent video editor, motion graphics artist and graphic designer, collaborating directly with brands, creators and studios on edits that need to ship fast without losing craft.",
      aboutFocus:
        "Short-form social editing, real-estate films, product videos, motion graphics systems and AI-assisted video workflows.",
      aboutWorkflow:
        "Brief and references â†’ footage review and selects â†’ assembly and pacing â†’ motion graphics and grade â†’ sound design and mix â†’ delivery in every required ratio.",
      aboutTools: "Premiere Pro, After Effects, DaVinci Resolve, Photoshop, Illustrator, AI video tools.",
      aboutStrengths:
        "Clean storytelling, fast turnarounds, consistent colour, precise typography and reliable communication.",
      footerNote: "Video editor Â· motion graphics Â· graphic design Â· AI video",
    });
  }

  if ((await count("contact_settings")) === 0) {
    await db.insert(contactSettings).values({
      id: 1,
      email: "hello@mohitbabariya.studio",
      countryCode: "+91",
      phone: "",
      whatsapp: "",
      location: "India Â· working worldwide",
      instagram: "",
      youtube: "",
      linkedin: "",
      responseTime: "Replies within 24 hours",
    });
  }

  if ((await count("theme_settings")) === 0) {
    await db.insert(themeSettings).values({ id: 1 });
  }

  if ((await count("carousel_settings")) === 0) {
    await db.insert(carouselSettings).values(
      categoryRows.map((category, index) => ({
        categoryId: category.id,
        slots: index === 0 ? 7 : 5,
        centerSize: "large",
        sideSize: "small",
        autoFill: true,
        projectIds: "[]",
        sortOrder: index,
        isActive: true,
      })),
    );
  }
}

async function seedNotificationSettings() {
  const rows = await db.select().from(notificationSettings).limit(1);
  if (rows.length === 0) {
    await db.insert(notificationSettings).values({ id: 1, emailEnabled: false, notificationEmail: process.env.NOTIFICATION_EMAIL || process.env.SEED_ADMIN_EMAIL || "" });
  }
}

let ensured: Promise<void> | null = null;

/** Idempotent first-run bootstrap: verifies tables exist and seeds defaults. */
export function ensureDatabase(): Promise<void> {
  if (bootstrapped) return Promise.resolve();
  if (!ensured) {
    ensured = (async () => {
      await seedAdmin();
      await seedNotificationSettings();
      await seedContent();
      bootstrapped = true;
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}






