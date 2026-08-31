/**
 * Comprehensive utility for normalizing, parsing, and resolving video and embed URLs:
 * - Instagram Reels & Posts
 * - Google Drive Videos
 * - YouTube Videos & Shorts
 * - Vimeo
 * - Direct MP4 / WebM / Cloud Video Streams
 */

export type VideoType = "direct" | "instagram" | "drive" | "youtube" | "vimeo" | "unknown";

export type ParsedMediaUrl = {
  type: VideoType;
  originalUrl: string;
  streamUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  suggestedRatio: "16:9" | "9:16" | "1:1" | "4:5";
  isVertical: boolean;
  id?: string;
};

export function parseMediaUrl(inputUrl: string): ParsedMediaUrl {
  const url = (inputUrl || "").trim();
  if (!url) {
    return {
      type: "unknown",
      originalUrl: "",
      streamUrl: "",
      embedUrl: null,
      thumbnailUrl: null,
      suggestedRatio: "16:9",
      isVertical: false,
    };
  }

  // 1. INSTAGRAM (Reels, Posts, TV)
  const igMatch = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    const code = igMatch[1];
    const isReel = /\/reels?\/|reel/i.test(url);
    return {
      type: "instagram",
      originalUrl: url,
      streamUrl: `https://www.instagram.com/reel/${code}/embed/`,
      embedUrl: `https://www.instagram.com/p/${code}/embed/`,
      thumbnailUrl: null,
      suggestedRatio: isReel ? "9:16" : "1:1",
      isVertical: isReel,
      id: code,
    };
  }

  // 2. GOOGLE DRIVE
  const driveFileMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{25,})/i);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return {
      type: "drive",
      originalUrl: url,
      streamUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      suggestedRatio: "16:9",
      isVertical: false,
      id: fileId,
    };
  }

  // 3. YOUTUBE (Regular, Shorts, Embeds, youtu.be)
  const ytShortsMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (ytShortsMatch && ytShortsMatch[1]) {
    const id = ytShortsMatch[1];
    return {
      type: "youtube",
      originalUrl: url,
      streamUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      suggestedRatio: "9:16",
      isVertical: true,
      id,
    };
  }

  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      type: "youtube",
      originalUrl: url,
      streamUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      suggestedRatio: "16:9",
      isVertical: false,
      id,
    };
  }

  // 4. VIMEO
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      type: "vimeo",
      originalUrl: url,
      streamUrl: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
      thumbnailUrl: null,
      suggestedRatio: "16:9",
      isVertical: false,
      id,
    };
  }

  // 5. DIRECT VIDEO STREAM (MP4, WebM, MOV, Vercel Blob, /api/files/, etc.)
  return {
    type: "direct",
    originalUrl: url,
    streamUrl: url,
    embedUrl: null,
    thumbnailUrl: null,
    suggestedRatio: "16:9",
    isVertical: false,
  };
}
