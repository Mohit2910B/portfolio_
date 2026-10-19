import { db } from "@/db";
import { categories, portfolioProjects, portfolioSourceConfig } from "@/db/schema";
import { runDriveSync, cleanTitle, slugify } from "./driveSync";
import { desc, eq, isNull } from "drizzle-orm";

export interface ParsedSource {
  type: "drive" | "youtube_channel" | "youtube_playlist" | "youtube_video" | "vimeo" | "custom";
  cleanId: string;
  originalUrl: string;
  displayLabel: string;
}

export function parsePortfolioSource(input: string): ParsedSource {
  const trimmed = (input || "").trim();

  // 1. YouTube Playlist
  const ytPlaylistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (trimmed.includes("youtube.com") && ytPlaylistMatch) {
    return {
      type: "youtube_playlist",
      cleanId: ytPlaylistMatch[1],
      originalUrl: trimmed,
      displayLabel: `YouTube Playlist (${ytPlaylistMatch[1]})`,
    };
  }

  // 2. YouTube Channel (@handle or /channel/UC... or /c/...)
  if (trimmed.includes("youtube.com/@") || trimmed.includes("youtu.be/@") || trimmed.startsWith("@")) {
    const handle = trimmed.match(/@([a-zA-Z0-9_.-]+)/)?.[1] || trimmed.replace(/^@/, "");
    return {
      type: "youtube_channel",
      cleanId: `@${handle}`,
      originalUrl: trimmed.startsWith("http") ? trimmed : `https://youtube.com/@${handle}`,
      displayLabel: `YouTube Channel (@${handle})`,
    };
  }

  const ytChannelIdMatch = trimmed.match(/\/channel\/(UC[a-zA-Z0-9_-]{20,})/i);
  if (ytChannelIdMatch) {
    return {
      type: "youtube_channel",
      cleanId: ytChannelIdMatch[1],
      originalUrl: trimmed,
      displayLabel: `YouTube Channel (${ytChannelIdMatch[1]})`,
    };
  }

  // 3. YouTube Single Video
  const ytVideoMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytVideoMatch) {
    return {
      type: "youtube_video",
      cleanId: ytVideoMatch[1],
      originalUrl: trimmed,
      displayLabel: `YouTube Video (${ytVideoMatch[1]})`,
    };
  }

  // 4. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      cleanId: vimeoMatch[1],
      originalUrl: trimmed,
      displayLabel: `Vimeo Video (${vimeoMatch[1]})`,
    };
  }

  // 5. Google Drive Folder
  const driveFolderMatch =
    trimmed.match(/\/folders\/([a-zA-Z0-9_-]{20,})/i) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);

  if (driveFolderMatch) {
    return {
      type: "drive",
      cleanId: driveFolderMatch[1],
      originalUrl: trimmed,
      displayLabel: `Google Drive Folder (${driveFolderMatch[1]})`,
    };
  }

  // Raw Google Drive folder ID (alphanumeric 25-45 chars without spaces)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return {
      type: "drive",
      cleanId: trimmed,
      originalUrl: `https://drive.google.com/drive/folders/${trimmed}`,
      displayLabel: `Google Drive Folder (${trimmed})`,
    };
  }

  return {
    type: "custom",
    cleanId: trimmed,
    originalUrl: trimmed,
    displayLabel: trimmed || "Custom Portfolio Source",
  };
}

export async function getPortfolioSourceConfig() {
  try {
    const rows = await db
      .select()
      .from(portfolioSourceConfig)
      .orderBy(desc(portfolioSourceConfig.id))
      .limit(1);

    if (rows.length > 0) {
      return rows[0];
    }
  } catch (err) {
    console.warn("[portfolioSource] Error querying portfolio_source_config:", err);
  }

  // Default fallback
  return {
    id: 1,
    sourceType: "drive",
    sourceUrl: "https://drive.google.com/drive/folders/1qDP0lUvRfyDsvktivuDTviwKxfi67W1i",
    folderId: "1qDP0lUvRfyDsvktivuDTviwKxfi67W1i",
    channelTitle: "Google Drive Portfolio",
    lastSyncedAt: null,
    syncStatus: "idle",
    totalItems: 0,
    detailsJson: "{}",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function savePortfolioSourceConfig(sourceUrl: string) {
  const parsed = parsePortfolioSource(sourceUrl);
  const now = new Date();

  const data = {
    sourceType: parsed.type.startsWith("youtube") ? "youtube" : parsed.type,
    sourceUrl: parsed.originalUrl,
    folderId: parsed.cleanId,
    channelTitle: parsed.displayLabel,
    updatedAt: now,
    detailsJson: JSON.stringify({
      parsedType: parsed.type,
      cleanId: parsed.cleanId,
      updatedAt: now.toISOString(),
    }),
  };

  try {
    const inserted = await db
      .insert(portfolioSourceConfig)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: portfolioSourceConfig.id,
        set: data,
      })
      .returning();

    return inserted[0] || { id: 1, ...data };
  } catch (err) {
    console.error("[portfolioSource] Save error:", err);
    throw err;
  }
}

/**
 * Synchronizes videos from a YouTube Channel or Playlist feed into Categories and PortfolioProjects.
 */
export async function syncYouTubeSource(sourceUrl: string) {
  const parsed = parsePortfolioSource(sourceUrl);
  let feedUrl = "";
  let channelName = "YouTube Portfolio";

  if (parsed.type === "youtube_playlist") {
    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${parsed.cleanId}`;
    channelName = `YouTube Playlist (${parsed.cleanId.slice(0, 10)})`;
  } else if (parsed.type === "youtube_channel") {
    if (parsed.cleanId.startsWith("UC")) {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${parsed.cleanId}`;
    } else {
      // Handle resolution (e.g. @handle)
      try {
        const handleUrl = parsed.originalUrl.startsWith("http")
          ? parsed.originalUrl
          : `https://www.youtube.com/${parsed.cleanId}`;
        const pageRes = await fetch(handleUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        const html = await pageRes.text();

        const channelIdMatch =
          html.match(/channel_id=([a-zA-Z0-9_-]+)/) ||
          html.match(/itemprop="channelId"\s+content="([^"]+)"/) ||
          html.match(/"channelId":"([^"]+)"/);

        const titleMatch =
          html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
          html.match(/<title>(.*?)<\/title>/i);

        if (titleMatch) {
          channelName = titleMatch[1].replace(" - YouTube", "").trim();
        }

        if (channelIdMatch) {
          feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
        }
      } catch (e) {
        console.warn("[portfolioSource] Failed resolving YouTube handle HTML:", e);
      }
    }
  }

  if (!feedUrl) {
    throw new Error(
      `Unable to resolve YouTube feed URL for "${sourceUrl}". Please provide a valid YouTube Channel link or Playlist URL.`
    );
  }

  const feedRes = await fetch(feedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });

  if (!feedRes.ok) {
    throw new Error(`YouTube feed returned status ${feedRes.status}. Make sure the channel or playlist is public.`);
  }

  const xml = await feedRes.text();

  // Extract Feed Channel Title if not yet set
  const feedTitleMatch = xml.match(/<title>([^<]+)<\/title>/);
  if (feedTitleMatch && feedTitleMatch[1]) {
    channelName = feedTitleMatch[1].trim();
  }

  // 1. Ensure a Category exists for YouTube
  const catSlug = slugify(channelName) || "youtube-portfolio";
  let targetCat = (
    await db
      .select()
      .from(categories)
      .where(eq(categories.slug, catSlug))
      .limit(1)
  )[0];

  if (!targetCat) {
    const existingCats = await db.select().from(categories).where(isNull(categories.deletedAt));
    const nextOrder = existingCats.length + 1;

    const insertedCat = await db
      .insert(categories)
      .values({
        name: channelName,
        slug: catSlug,
        description: `Imported videos from ${channelName}`,
        sortOrder: nextOrder,
        isActive: true,
      })
      .returning();
    targetCat = insertedCat[0];
  }

  // 2. Parse video entries
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries = [...xml.matchAll(entryRegex)];

  let importedCount = 0;
  const now = new Date();

  for (let i = 0; i < entries.length; i++) {
    const entryXml = entries[i][1];
    const videoId = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) continue;

    const rawTitle = entryXml.match(/<title>([^<]+)<\/title>/)?.[1] || "Untitled Video";
    const title = cleanTitle(rawTitle);
    const published = entryXml.match(/<published>([^<]+)<\/published>/)?.[1];
    const year = published ? new Date(published).getFullYear() : 2026;

    const thumb =
      entryXml.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const description =
      entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ||
      `${title} showcase video.`;

    const isShort =
      rawTitle.toLowerCase().includes("short") ||
      rawTitle.toLowerCase().includes("reel") ||
      rawTitle.includes("#Shorts");

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const driveFileId = `yt_${videoId}`;

    // Upsert project
    const existingProject = (
      await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.driveFileId, driveFileId))
        .limit(1)
    )[0];

    if (existingProject) {
      await db
        .update(portfolioProjects)
        .set({
          title,
          videoUrl,
          thumbnailUrl: thumb,
          externalUrl: videoUrl,
          aspectRatio: isShort ? "9:16" : "16:9",
          categoryId: targetCat?.id || existingProject.categoryId,
          categoryLabel: targetCat?.name || existingProject.categoryLabel,
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(portfolioProjects.id, existingProject.id));
    } else {
      await db.insert(portfolioProjects).values({
        title,
        description: description.slice(0, 300),
        videoUrl,
        thumbnailUrl: thumb,
        externalUrl: videoUrl,
        driveFileId,
        categoryId: targetCat?.id,
        categoryLabel: targetCat?.name || "YouTube",
        aspectRatio: isShort ? "9:16" : "16:9",
        displaySize: i === 0 ? "large" : "medium",
        sortOrder: i + 1,
        year,
        isPublished: true,
        isFeatured: i < 4,
        lastSyncedAt: now,
      });
    }

    importedCount++;
  }

  // Update config state
  await db
    .update(portfolioSourceConfig)
    .set({
      lastSyncedAt: now,
      syncStatus: "idle",
      totalItems: importedCount,
      channelTitle: channelName,
    })
    .where(eq(portfolioSourceConfig.id, 1));

  return {
    success: true,
    platform: "youtube",
    channelTitle: channelName,
    videosSynced: importedCount,
    categoryName: targetCat?.name || channelName,
    message: `Successfully synced ${importedCount} videos from YouTube channel "${channelName}"!`,
  };
}

/**
 * Executes a full sync based on the currently active portfolio source.
 */
export async function runActiveSourceSync(customSourceUrl?: string) {
  let sourceConfig = await getPortfolioSourceConfig();

  if (customSourceUrl && customSourceUrl !== sourceConfig.sourceUrl) {
    sourceConfig = await savePortfolioSourceConfig(customSourceUrl);
  }

  const parsed = parsePortfolioSource(sourceConfig.sourceUrl);

  if (parsed.type === "drive") {
    const driveResult = await runDriveSync(parsed.cleanId, "manual");
    await db
      .update(portfolioSourceConfig)
      .set({
        lastSyncedAt: new Date(),
        syncStatus: "idle",
        totalItems: driveResult.videosSynced,
      })
      .where(eq(portfolioSourceConfig.id, 1));

    return {
      success: driveResult.success,
      platform: "drive",
      sourceTitle: "Google Drive Portfolio",
      videosSynced: driveResult.videosSynced,
      categoriesSynced: driveResult.categoriesSynced,
      message: `Successfully synchronized ${driveResult.categoriesSynced} categories and ${driveResult.videosSynced} videos from Google Drive!`,
    };
  } else if (parsed.type.startsWith("youtube")) {
    return await syncYouTubeSource(sourceConfig.sourceUrl);
  } else {
    throw new Error(`Unsupported source type "${parsed.type}". Supported platforms: Google Drive, YouTube.`);
  }
}
