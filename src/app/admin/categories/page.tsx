"use client";

import { useEffect, useState, useRef } from "react";
import { uploadFileInChunks } from "@/lib/chunkedUpload";

interface Category {
  id: number;
  driveFolderId?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  videoCount?: number;
}

interface DeletedCategoryInfo {
  id?: number | string;
  slug: string;
  name: string;
  driveFolderId?: string;
  deletedAt: string;
}

interface ProjectVideo {
  id: number;
  driveFileId?: string;
  categoryId: number;
  category: string;
  categoryLabel?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio?: string;
  isHighQualityManual?: boolean;
}

/** Automatically normalizes Google Drive share links to direct streaming MP4 links */
function normalizeVideoUrl(input: string): string {
  const trimmed = input.trim();
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (fileMatch) {
    return `https://drive.google.com/uc?id=${fileMatch[1]}&export=download`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idMatch && !trimmed.includes("export=download")) {
    return `https://drive.google.com/uc?id=${idMatch[1]}&export=download`;
  }
  return trimmed;
}

interface PortfolioSourceConfig {
  sourceType: "google_drive" | "youtube_channel" | "youtube_playlist" | "vimeo" | "custom";
  sourceUrl: string;
  sourceLabel?: string;
  autoSync: boolean;
  lastSyncedAt?: string | null;
  syncStatus?: string | null;
  itemsCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deletedCategories, setDeletedCategories] = useState<DeletedCategoryInfo[]>([]);
  const [projects, setProjects] = useState<ProjectVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);

  // Portfolio Source (Drive / YouTube / Vimeo) Switcher State
  const [sourceConfig, setSourceConfig] = useState<PortfolioSourceConfig | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [sourceInputUrl, setSourceInputUrl] = useState("");
  const [savingSource, setSavingSource] = useState(false);
  const [sourceSyncStatus, setSourceSyncStatus] = useState("");

  // Video Replacement Drawer/Modal State
  const [activeCategoryForVideos, setActiveCategoryForVideos] = useState<Category | null>(null);
  const [uploadingForVideoId, setUploadingForVideoId] = useState<string | number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Direct URL paste inline state
  const [editingUrlForVideoId, setEditingUrlForVideoId] = useState<string | number | null>(null);
  const [inputUrlValue, setInputUrlValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [targetVideoForUpload, setTargetVideoForUpload] = useState<ProjectVideo | null>(null);
  const [targetVideoForThumb, setTargetVideoForThumb] = useState<ProjectVideo | null>(null);

  const fetchCatsAndProjects = async () => {
    try {
      // 0. Fetch active portfolio source config (Google Drive or YouTube)
      try {
        const resSource = await fetch("/api/portfolio/source");
        const sourceData = await resSource.json().catch(() => ({}));
        if (sourceData.config) {
          setSourceConfig(sourceData.config);
          setSourceInputUrl(sourceData.config.sourceUrl || "");
        }
      } catch (e) {
        console.warn("Could not fetch portfolio source config:", e);
      }

      // 1. Fetch categories (including soft-deleted categories list)
      const resCat = await fetch("/api/categories?includeTrash=true");
      const catData = await resCat.json().catch(() => ({}));
      if (catData.categories) setCategories(catData.categories);
      if (catData.deletedCategories) setDeletedCategories(catData.deletedCategories);

      // 2. Fetch projects synced from Drive / Database
      const resDrive = await fetch("/api/drive/sync");
      const driveData = await resDrive.json().catch(() => ({}));
      if (driveData.projects) setProjects(driveData.projects);
      if (driveData.categories && (!catData.categories || catData.categories.length === 0)) {
        setCategories(driveData.categories);
      }
    } catch (err: unknown) {
      console.warn("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatsAndProjects();
  }, []);

  const handleSyncWithDrive = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      // Run sync on the active configured source (Google Drive or YouTube)
      const res = await fetch("/api/portfolio/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncNow: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setSyncMessage(`✓ SUCCESS! ${data.message || "Portfolio synced successfully!"}`);
        await fetchCatsAndProjects();
      } else {
        // Fallback to legacy drive sync
        const resDrive = await fetch("/api/drive/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: true }),
        });
        const driveData = await resDrive.json().catch(() => ({}));
        if (driveData.success) {
          setSyncMessage(
            `✓ SUCCESS! Synced ${driveData.categoriesCount} categories and ${driveData.projectsCount} videos from Google Drive!`
          );
          await fetchCatsAndProjects();
        } else {
          setSyncMessage(`⚠ Sync note: ${data.error || driveData.error || "Unable to sync"}`);
        }
      }
    } catch (err: unknown) {
      setSyncMessage(
        `⚠ Sync error: ${err instanceof Error ? err.message : "Network error"}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSourceConfig = async (syncNow: boolean) => {
    if (!sourceInputUrl.trim()) {
      alert("Please enter a valid Google Drive folder URL or YouTube Channel/Playlist link.");
      return;
    }
    setSavingSource(true);
    setSourceSyncStatus(syncNow ? "Connecting & Scanning Media Source..." : "Saving configuration...");
    try {
      const res = await fetch("/api/portfolio/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceInputUrl.trim(),
          syncNow,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update source");
      }
      setSourceConfig(data.config);
      setSourceSyncStatus(
        syncNow
          ? `✓ SUCCESS! ${data.message || "Portfolio source synced!"}`
          : "✓ Source link saved successfully!"
      );
      await fetchCatsAndProjects();
      setTimeout(() => {
        setSavingSource(false);
        setSourceModalOpen(false);
        setSourceSyncStatus("");
      }, 1800);
    } catch (err: unknown) {
      setSavingSource(false);
      setSourceSyncStatus(`⚠ Error: ${err instanceof Error ? err.message : "Network error"}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name) return;

    try {
      const method = editingCat.id ? "PUT" : "POST";
      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCat),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEditingCat(null);
        setSyncMessage(`✓ Category "${editingCat.name}" saved successfully!`);
        await fetchCatsAndProjects();
      } else {
        setSyncMessage(`⚠ Error saving category: ${data.error || "Failed to save category"}`);
      }
    } catch (err: any) {
      setSyncMessage(`⚠ Save failed: ${err.message || "Network error"}`);
    }
  };

  // Soft-Delete (Move to Trash)
  const handleDelete = async (cat: Category) => {
    const okDelete = confirm(
      `Move "${cat.name}" category to Trash?\nThis category and its videos will be hidden from the website immediately. You can restore it anytime.`
    );
    if (!okDelete) return;

    try {
      // Optimistically remove from active list
      setCategories((prev) => prev.filter((c) => c.slug !== cat.slug && c.id !== cat.id));

      const queryParams = new URLSearchParams({
        id: String(cat.id),
        slug: cat.slug || "",
      });

      const res = await fetch(`/api/categories?${queryParams.toString()}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      setSyncMessage(`✓ Category "${cat.name}" moved to Trash and removed from live website!`);
      await fetchCatsAndProjects();
    } catch (err: unknown) {
      setSyncMessage(
        `⚠ Error deleting: ${err instanceof Error ? err.message : "Error deleting category"}`
      );
      await fetchCatsAndProjects();
    }
  };

  // Restore Previously Soft-Deleted Category from Trash
  const handleRestore = async (deletedCat: DeletedCategoryInfo) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", slug: deletedCat.slug, id: deletedCat.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to restore");

      setSyncMessage(`✓ Restored "${deletedCat.name}" and all its videos back to the website!`);
      await fetchCatsAndProjects();
    } catch (err: unknown) {
      setSyncMessage(
        `⚠ Error restoring: ${err instanceof Error ? err.message : "Error restoring category"}`
      );
    }
  };

  // Permanent Deletion (Explicit Confirmed Action)
  const handlePermanentDelete = async (delCat: DeletedCategoryInfo) => {
    const okPermanent = confirm(
      `⚠️ PERMANENT DELETION CONFIRMATION:\n\nAre you sure you want to permanently delete "${delCat.name}" from the database?\nThis action CANNOT be undone.`
    );
    if (!okPermanent) return;

    try {
      const res = await fetch(`/api/categories?id=${delCat.id}&permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to permanently delete");

      setSyncMessage(`✓ Category "${delCat.name}" permanently deleted.`);
      await fetchCatsAndProjects();
    } catch (err: unknown) {
      setSyncMessage(
        `⚠ Error: ${err instanceof Error ? err.message : "Permanent delete failed"}`
      );
    }
  };

  // Video Replacement Upload Trigger
  const triggerVideoUpload = (video: ProjectVideo) => {
    setTargetVideoForUpload(video);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const triggerThumbUpload = (video: ProjectVideo) => {
    setTargetVideoForThumb(video);
    if (thumbInputRef.current) {
      thumbInputRef.current.value = "";
      thumbInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetVideoForUpload) return;

    const ALLOWED_EXT = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      alert(`Unsupported video format "${ext}". Please select a valid video file (.mp4, .mov, .webm, .mkv).`);
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert(`File size ${(file.size / (1024 * 1024)).toFixed(0)} MB exceeds the 500MB maximum upload limit.`);
      return;
    }

    const vidKey = targetVideoForUpload.driveFileId || targetVideoForUpload.title || targetVideoForUpload.id;
    setUploadingForVideoId(vidKey);
    setUploadStatus(`Uploading "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      // Chunked & Blob-compatible upload without hitting 413 error
      const uploadResult = await uploadFileInChunks(file, (percent, loadedMB, totalMB) => {
        setUploadStatus(`Uploading HQ Video: ${percent}% (${loadedMB} / ${totalMB} MB)...`);
      });

      const hqVideoUrl = uploadResult.url;
      setUploadStatus("Saving high-quality replacement into portfolio...");

      // Save override
      const resOverride = await fetch("/api/drive/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: vidKey,
          driveFileId: targetVideoForUpload.driveFileId,
          projectTitle: targetVideoForUpload.title,
          projectId: targetVideoForUpload.id,
          videoUrl: hqVideoUrl,
          thumbnailUrl: targetVideoForUpload.thumbnailUrl,
        }),
      });

      const dataOverride = await resOverride.json().catch(() => ({}));
      if (!resOverride.ok) {
        throw new Error(dataOverride.error || "Failed to save replacement");
      }

      setUploadStatus("✓ Success! High-quality video replaced successfully!");
      await fetchCatsAndProjects();
      setTimeout(() => {
        setUploadStatus("");
        setUploadingForVideoId(null);
      }, 2500);
    } catch (err: unknown) {
      setUploadStatus(`⚠ Note: ${err instanceof Error ? err.message : "Upload error"}`);
      setTimeout(() => {
        setUploadingForVideoId(null);
      }, 5000);
    }
  };

  const handleThumbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetVideoForThumb) return;

    const vidKey = targetVideoForThumb.driveFileId || targetVideoForThumb.title || targetVideoForThumb.id;
    setUploadingForVideoId(vidKey);
    setUploadStatus(`Uploading thumbnail "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resUpload = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const text = await resUpload.text();
      let dataUpload: any = null;
      try {
        dataUpload = JSON.parse(text);
      } catch {
        throw new Error(`Upload error: ${text.slice(0, 80)}`);
      }

      if (!resUpload.ok || !dataUpload?.url) {
        throw new Error(dataUpload?.error || "Thumbnail upload failed");
      }

      const thumbUrl = dataUpload.url;

      // Save override
      await fetch("/api/drive/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: vidKey,
          driveFileId: targetVideoForThumb.driveFileId,
          projectTitle: targetVideoForThumb.title,
          projectId: targetVideoForThumb.id,
          videoUrl: targetVideoForThumb.videoUrl,
          thumbnailUrl: thumbUrl,
        }),
      });

      setUploadStatus("✓ Custom thumbnail updated!");
      await fetchCatsAndProjects();
      setTimeout(() => {
        setUploadStatus("");
        setUploadingForVideoId(null);
      }, 2000);
    } catch (err: unknown) {
      setUploadStatus(`⚠ Error: ${err instanceof Error ? err.message : "Upload error"}`);
      setTimeout(() => {
        setUploadingForVideoId(null);
      }, 4000);
    }
  };

  const handleSavePastedUrl = async (vid: ProjectVideo) => {
    if (!inputUrlValue.trim()) return;
    const vidKey = vid.driveFileId || vid.title || vid.id;
    setUploadingForVideoId(vidKey);
    setUploadStatus("Saving high-quality video URL...");

    const normalizedUrl = normalizeVideoUrl(inputUrlValue);

    try {
      const res = await fetch("/api/drive/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: vidKey,
          driveFileId: vid.driveFileId,
          projectTitle: vid.title,
          projectId: vid.id,
          videoUrl: normalizedUrl,
          thumbnailUrl: vid.thumbnailUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save URL");
      }

      setEditingUrlForVideoId(null);
      setInputUrlValue("");
      setUploadStatus("✓ Success! High-quality video link replaced successfully!");
      await fetchCatsAndProjects();
      setTimeout(() => {
        setUploadStatus("");
        setUploadingForVideoId(null);
      }, 2500);
    } catch (err: unknown) {
      setUploadStatus(`⚠ Error: ${err instanceof Error ? err.message : "Error saving URL"}`);
      setTimeout(() => {
        setUploadingForVideoId(null);
      }, 4000);
    }
  };

  const handleRevertVideo = async (video: ProjectVideo) => {
    if (!confirm(`Revert "${video.title}" back to original Google Drive video?`)) return;
    const vidKey = video.driveFileId || video.title || video.id;
    try {
      await fetch(`/api/drive/override?key=${encodeURIComponent(String(vidKey))}`, {
        method: "DELETE",
      });
      await fetchCatsAndProjects();
      setSyncMessage(`✓ Reverted "${video.title}" back to Drive original.`);
    } catch {}
  };

  // Filter projects belonging to active category
  const activeCategoryVideos = activeCategoryForVideos
    ? projects.filter((p) => {
        if (p.categoryId === activeCategoryForVideos.id) return true;
        const catName = activeCategoryForVideos.name.toLowerCase().trim();
        const catSlug = activeCategoryForVideos.slug.toLowerCase().trim();
        const pCat = (p.category || p.categoryLabel || "").toLowerCase().trim();
        return pCat === catName || pCat.includes(catName) || catName.includes(pCat) || pCat.includes(catSlug);
      })
    : [];

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Hidden File Inputs for Manual Video/Thumbnail Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
        className="hidden"
      />
      <input
        type="file"
        ref={thumbInputRef}
        onChange={handleThumbChange}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(243,240,232,0.12)] pb-6">
        <div>
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest font-bold">
            CMS MODULE // CATEGORY & VIDEO MANAGER
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#F3F0E8]">
            CATEGORIES & VIDEOS ({categories.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Portfolio Source Switcher Button */}
          <button
            onClick={() => {
              setSourceInputUrl(sourceConfig?.sourceUrl || "");
              setSourceModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-[#C7A56A] to-amber-600 text-black font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg flex items-center space-x-2 rounded"
          >
            <span>🔗</span>
            <span>PORTFOLIO LINK</span>
          </button>

          <button
            onClick={handleSyncWithDrive}
            disabled={syncing}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50 rounded"
          >
            <span className={syncing ? "animate-spin" : ""}>🔄</span>
            <span>
              {syncing
                ? "SYNCING..."
                : sourceConfig?.sourceType?.startsWith("youtube")
                ? "SYNC WITH YOUTUBE"
                : "SYNC WITH GOOGLE DRIVE"}
            </span>
          </button>

          <button
            onClick={() => setEditingCat({ name: "", slug: "", description: "" })}
            className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] rounded"
          >
            + ADD MANUAL CATEGORY
          </button>
        </div>
      </div>

      {/* Live Sync / Action Notifications */}
      {syncMessage && (
        <div
          className={`p-4 border font-mono text-xs rounded-lg flex items-center justify-between ${
            syncMessage.startsWith("✓")
              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200"
              : "bg-amber-950/70 border-amber-500/40 text-amber-200"
          }`}
        >
          <span>{syncMessage}</span>
          <button
            onClick={() => setSyncMessage("")}
            className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Portfolio Source Connection Info Card */}
      <div className="bg-[#111111] border border-[rgba(243,240,232,0.15)] p-6 space-y-4 rounded-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${sourceConfig?.sourceType?.startsWith("youtube") ? "bg-rose-500" : "bg-emerald-400"} animate-pulse`} />
              <span className={`${sourceConfig?.sourceType?.startsWith("youtube") ? "text-rose-400" : "text-emerald-400"} font-bold tracking-widest uppercase`}>
                ACTIVE SOURCE: {sourceConfig?.sourceType?.startsWith("youtube") ? "YOUTUBE CHANNEL / PLAYLIST" : "GOOGLE DRIVE CLOUD STORAGE"}
              </span>
              {sourceConfig?.lastSyncedAt && (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-mono">
                  Synced: {new Date(sourceConfig.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8A8A8A] max-w-3xl leading-relaxed">
              {sourceConfig?.sourceType?.startsWith("youtube")
                ? "Your portfolio is currently synced with YouTube. Videos stream at maximum HD/4K resolution with zero login permission blocks or Google Drive bandwidth limits. Click 'PORTFOLIO LINK' anytime to switch channels, playlists, or return to Drive."
                : "Google Drive automatically syncs your folders and videos into portfolio categories. If clients report 'Request Access' errors on newly created folders, ensure folder sharing is set to 'Anyone with the link - Viewer', or switch to YouTube with zero access limits!"}
            </p>
            {sourceConfig?.sourceUrl && (
              <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-[#C7A56A] truncate max-w-2xl">
                <span className="text-gray-500">Connected URL:</span>
                <span className="truncate underline">{sourceConfig.sourceUrl}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => {
                setSourceInputUrl(sourceConfig?.sourceUrl || "");
                setSourceModalOpen(true);
              }}
              className="px-4 py-2 border border-[#C7A56A] text-[#C7A56A] hover:bg-[#C7A56A] hover:text-black font-mono text-xs font-bold tracking-wider uppercase transition-all rounded"
            >
              ⚙ Change Link
            </button>
            {sourceConfig?.sourceUrl && (
              <a
                href={sourceConfig.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 font-mono text-xs font-bold tracking-wider uppercase transition-all rounded"
              >
                Open Source ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Manual Category Create / Edit Form */}
      {editingCat && (
        <form
          onSubmit={handleSave}
          className="bg-[#141414] border border-[#C7A56A] p-6 space-y-4 font-mono text-xs rounded-xl shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[rgba(243,240,232,0.1)] pb-3">
            <span className="text-[#C7A56A] font-bold uppercase tracking-wider text-sm">
              {editingCat.id ? "EDIT CATEGORY" : "CREATE NEW CATEGORY"}
            </span>
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="text-[#8A8A8A] hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. Commercial"
                value={editingCat.name || ""}
                onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-sm text-[#F3F0E8] rounded"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#8A8A8A]">SLUG</label>
              <input
                type="text"
                placeholder="commercial"
                value={editingCat.slug || ""}
                onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                className="w-full bg-[#080808] border border-[rgba(243,240,232,0.2)] p-2.5 text-xs text-[#F3F0E8] rounded"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-2">
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="px-4 py-2 border border-[rgba(243,240,232,0.2)] text-[#8A8A8A] hover:text-[#F3F0E8] rounded"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold rounded"
            >
              SAVE CATEGORY
            </button>
          </div>
        </form>
      )}

      {/* Active Categories Table */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8A8A8A]">
          CONNECTING & LOADING CATEGORIES...
        </div>
      ) : (
        <div className="border border-[rgba(243,240,232,0.12)] bg-[#111111] overflow-x-auto rounded-xl">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[rgba(243,240,232,0.12)] text-[#8A8A8A] uppercase bg-[#080808]">
                <th className="p-4">CATEGORY NAME</th>
                <th className="p-4">VIDEOS</th>
                <th className="p-4">DRIVE FOLDER</th>
                <th className="p-4 text-center">MANAGE VIDEOS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(243,240,232,0.08)]">
              {categories.map((c) => {
                const catVideoCount =
                  projects.filter((p) => {
                    if (p.categoryId === c.id) return true;
                    const catName = c.name.toLowerCase().trim();
                    const pCat = (p.category || p.categoryLabel || "").toLowerCase().trim();
                    return pCat === catName || pCat.includes(catName);
                  }).length || c.videoCount || 0;

                return (
                  <tr key={c.id || c.slug} className="hover:bg-[#161616] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[#F3F0E8] text-sm">{c.name}</div>
                      <div className="text-[11px] text-[#C7A56A]">{c.slug}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                        {catVideoCount} Videos
                      </span>
                    </td>
                    <td className="p-4">
                      {c.driveFolderId ? (
                        <a
                          href={`https://drive.google.com/drive/folders/${c.driveFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Open in Drive ↗
                        </a>
                      ) : (
                        <span className="text-[#555]">Manual</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setActiveCategoryForVideos(c)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-[#C7A56A] hover:brightness-110 text-black font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5 mx-auto"
                      >
                        <span>🎬</span>
                        <span>VIEW & REPLACE VIDEOS</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingCat(c)}
                        className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#C7A56A] hover:text-[#080808] text-[#F3F0E8] rounded transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="px-2.5 py-1 bg-rose-950/70 text-rose-300 hover:bg-rose-600 hover:text-white rounded transition-colors font-bold"
                        title="Permanently remove category from website"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deleted / Hidden Categories Section with 1-Click Restore */}
      {deletedCategories.length > 0 && (
        <div className="bg-[#121212] border border-rose-950/60 rounded-xl p-5 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-rose-400 text-sm">🗑️</span>
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                DELETED / HIDDEN CATEGORIES ({deletedCategories.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#8A8A8A]">
              Click "RESTORE" to bring any category back to the website
            </span>
          </div>

          <div className="divide-y divide-white/5 border border-white/5 rounded-lg overflow-hidden bg-[#0a0a0a]">
            {deletedCategories.map((del) => (
              <div
                key={del.slug}
                className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <span className="font-bold text-[#F3F0E8]">{del.name || del.slug}</span>
                  <span className="ml-2 text-[10px] text-[#8A8A8A]">({del.slug})</span>
                  {del.deletedAt && (
                    <div className="text-[10px] text-gray-500">
                      Deleted: {new Date(del.deletedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleRestore(del)}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-600 hover:text-white text-emerald-300 border border-emerald-500/40 rounded text-xs font-bold uppercase transition-all"
                  >
                    ↺ RESTORE
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(del)}
                    className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 rounded text-xs font-bold uppercase transition-all"
                    title="Permanently remove category from database"
                  >
                    🗑 PERMANENT DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: VIEW & REPLACE VIDEOS IN CATEGORY */}
      {activeCategoryForVideos && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-[#0e0e0e] border border-[rgba(243,240,232,0.2)] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
            {/* Modal Header */}
            <div className="p-5 bg-[#141414] border-b border-[rgba(243,240,232,0.12)] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#C7A56A] uppercase tracking-widest font-bold">
                  CATEGORY VIDEO MANAGER // HIGH QUALITY REPLACER
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-[#F3F0E8] uppercase tracking-tight">
                  {activeCategoryForVideos.name} ({activeCategoryVideos.length} Videos)
                </h2>
              </div>

              <button
                onClick={() => {
                  setActiveCategoryForVideos(null);
                  setUploadStatus("");
                  setEditingUrlForVideoId(null);
                }}
                className="px-4 py-2 bg-[#222] hover:bg-rose-900 text-white rounded-lg text-xs font-bold transition-all"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Upload Notification Banner */}
            {uploadStatus && (
              <div
                className={`p-3 border-b text-xs px-6 font-bold flex items-center space-x-2 ${
                  uploadStatus.startsWith("✓")
                    ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                    : uploadStatus.startsWith("⚠")
                    ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                    : "bg-amber-950/90 border-amber-500/50 text-amber-200"
                }`}
              >
                <span className={uploadStatus.startsWith("✓") ? "" : "animate-spin"}>
                  {uploadStatus.startsWith("✓") ? "✓" : "🔄"}
                </span>
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* Videos List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="text-xs text-[#8A8A8A] bg-[#161616] p-3 rounded-lg border border-white/5 leading-relaxed">
                💡 <strong className="text-white">વિડિયો ક્વોલિટી બદલવા માટે બે સરળ ઓપ્શન:</strong><br />
                1. <strong>"⚡ UPLOAD HQ FILE"</strong>: કમ્પ્યુટર/મોબાઈલમાંથી ઓરિજિનલ `.mp4` કે `.mov` ફાઇલ સિલેક્ટ કરો.<br />
                2. <strong>"🔗 PASTE URL"</strong>: અથવા Google Drive શેર લિંક કે direct video link પેસ્ટ કરી Save કરો (કોઈ સાઇઝ લિમિટ નથી, 4K/1080p ડાયરેક્ટ ચાલશે)!
              </div>

              {activeCategoryVideos.length === 0 ? (
                <div className="py-16 text-center text-[#8A8A8A] text-xs">
                  No videos discovered yet for this category. Click "SYNC WITH GOOGLE DRIVE" above to refresh.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeCategoryVideos.map((vid) => {
                    const vidKey = vid.driveFileId || vid.title || vid.id;
                    const isUploading = uploadingForVideoId === vidKey;
                    const isEditingUrl = editingUrlForVideoId === vidKey;
                    const isHq = Boolean(
                      vid.isHighQualityManual ||
                        vid.videoUrl.startsWith("/uploads/") ||
                        vid.videoUrl.includes("blob.vercel-storage.com")
                    );

                    return (
                      <div
                        key={vid.id || vidKey}
                        className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                          isHq
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : "bg-[#141414] border-[rgba(243,240,232,0.1)]"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Video Info Left */}
                          <div className="flex items-center space-x-4 min-w-0">
                            {vid.thumbnailUrl ? (
                              <img
                                src={vid.thumbnailUrl}
                                referrerPolicy="no-referrer"
                                alt=""
                                className="w-16 h-24 object-cover rounded-lg border border-white/10 bg-black shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-24 rounded-lg border border-white/10 bg-black flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                                NO THUMB
                              </div>
                            )}

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-[#F3F0E8] truncate max-w-sm sm:max-w-md">
                                  {vid.title}
                                </span>
                                {isHq ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                                    ⚡ HIGH QUALITY ACTIVE
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#222] text-[#8A8A8A] border border-white/10 uppercase">
                                    📁 DRIVE ORIGINAL
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#8A8A8A] truncate max-w-sm sm:max-w-lg">
                                URL: {vid.videoUrl}
                              </div>

                              <div className="text-[10px] text-[#C7A56A]">
                                Aspect: {vid.aspectRatio || "9:16"}
                              </div>
                            </div>
                          </div>

                          {/* Actions Right */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                            <button
                              onClick={() => triggerVideoUpload(vid)}
                              disabled={isUploading}
                              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-[#C7A56A] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all flex items-center space-x-1 disabled:opacity-50"
                            >
                              <span>⚡</span>
                              <span>{isUploading ? "UPLOADING..." : "UPLOAD HQ FILE"}</span>
                            </button>

                            <button
                              onClick={() => {
                                if (isEditingUrl) {
                                  setEditingUrlForVideoId(null);
                                } else {
                                  setEditingUrlForVideoId(vidKey);
                                  setInputUrlValue(vid.videoUrl || "");
                                }
                              }}
                              className="px-3 py-2 bg-[#222] hover:bg-[#333] text-[#C7A56A] border border-[#C7A56A]/40 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                            >
                              🔗 PASTE URL
                            </button>

                            <button
                              onClick={() => triggerThumbUpload(vid)}
                              disabled={isUploading}
                              className="px-3 py-2 bg-[#222] hover:bg-[#333] text-[#F3F0E8] border border-white/10 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                            >
                              🖼 THUMB
                            </button>

                            {isHq && (
                              <button
                                onClick={() => handleRevertVideo(vid)}
                                className="px-2.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs rounded-lg transition-all"
                                title="Revert back to Google Drive video stream"
                              >
                                ↺ REVERT
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Paste URL Form */}
                        {isEditingUrl && (
                          <div className="mt-2 p-3 bg-[#0a0a0a] border border-[#C7A56A]/40 rounded-lg flex flex-col sm:flex-row gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Paste Google Drive share link, YouTube, or direct MP4 URL..."
                              value={inputUrlValue}
                              onChange={(e) => setInputUrlValue(e.target.value)}
                              className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-xs text-white rounded focus:border-[#C7A56A] focus:outline-none"
                            />
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => handleSavePastedUrl(vid)}
                                className="px-4 py-2 bg-[#C7A56A] hover:bg-[#D8B77C] text-black font-bold text-xs uppercase rounded"
                              >
                                SAVE LINK
                              </button>
                              <button
                                onClick={() => setEditingUrlForVideoId(null)}
                                className="px-3 py-2 bg-[#222] hover:bg-[#333] text-gray-400 text-xs rounded"
                              >
                                CANCEL
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Source / Master Link Modal */}
      {sourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-[#C7A56A]/50 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 font-mono text-xs text-[#C7A56A] font-bold tracking-widest uppercase">
                  <span>🔗</span>
                  <span>PORTFOLIO MEDIA SOURCE SWITCHER</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-[#F3F0E8] mt-1">
                  MANAGE MASTER PORTFOLIO LINK
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!savingSource) {
                    setSourceModalOpen(false);
                    setSourceSyncStatus("");
                  }
                }}
                disabled={savingSource}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Tame tamari portfolio mate <strong className="text-white">Google Drive Folder</strong> athva <strong className="text-rose-400">YouTube Channel / Playlist</strong> ni link configure kari shako chho. Jyare pan link badlsho, live website par te platform na badha videos automatically sync thai jashe ane clients ne permission no koi issue nahi ave!
            </p>

            {/* Live Platform Detection Badge */}
            {sourceInputUrl.trim() && (
              <div className="p-3 rounded-lg border font-mono text-xs flex items-center space-x-2.5 transition-all animate-in fade-in duration-150">
                {sourceInputUrl.includes("youtube.com") || sourceInputUrl.includes("youtu.be") ? (
                  <div className="flex items-center space-x-2 text-rose-300 bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-lg w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold">🔴 YOUTUBE CHANNEL / PLAYLIST DETECTED</span>
                    <span className="text-[11px] text-gray-400 ml-auto hidden sm:inline">Zero permission blocks &amp; instant HD streaming!</span>
                  </div>
                ) : sourceInputUrl.includes("drive.google.com") ? (
                  <div className="flex items-center space-x-2 text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-lg w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold">📁 GOOGLE DRIVE FOLDER DETECTED</span>
                    <span className="text-[11px] text-gray-400 ml-auto hidden sm:inline">Set sharing to "Anyone with link"</span>
                  </div>
                ) : sourceInputUrl.includes("vimeo.com") ? (
                  <div className="flex items-center space-x-2 text-sky-300 bg-sky-950/40 border border-sky-500/40 p-2.5 rounded-lg w-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="font-bold">🔵 VIMEO DETECTED</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-300 bg-white/5 border border-white/10 p-2.5 rounded-lg w-full">
                    <span>🌐</span>
                    <span>CUSTOM WEB SOURCE</span>
                  </div>
                )}
              </div>
            )}

            {/* Input Form */}
            <div className="space-y-2">
              <label className="block font-mono text-xs text-[#C7A56A] uppercase font-bold tracking-wider">
                PORTFOLIO SOURCE URL / LINK:
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={sourceInputUrl}
                  onChange={(e) => setSourceInputUrl(e.target.value)}
                  placeholder="e.g. https://youtube.com/@mohitbabariya or Google Drive folder URL"
                  className="w-full bg-[#080808] border border-white/20 focus:border-[#C7A56A] text-[#F3F0E8] px-4 py-3 text-xs sm:text-sm rounded-lg font-mono focus:outline-none transition-colors"
                />
                {sourceInputUrl && (
                  <button
                    type="button"
                    onClick={() => setSourceInputUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* Presets & Quick Select */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSourceInputUrl("https://youtube.com/@mohitbabariya")}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs font-mono rounded flex items-center space-x-1.5 transition-all"
                >
                  <span>🔴</span>
                  <span>Mohit Babariya YouTube (@mohitbabariya)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSourceInputUrl(
                      "https://drive.google.com/drive/folders/1qDP0lUvRfyDsvktivuDTviwKxfi67W1i"
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono rounded flex items-center space-x-1.5 transition-all"
                >
                  <span>📁</span>
                  <span>Default Google Drive Root Folder</span>
                </button>
              </div>
            </div>

            {/* Helpful Platform Comparison Card */}
            <div className="bg-[#181818] border border-white/10 rounded-xl p-4 text-xs space-y-2">
              <div className="font-mono text-[11px] text-[#C7A56A] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <span>💡</span>
                <span>Pro Tip: Google Drive vs YouTube for Client Portfolios</span>
              </div>
              <ul className="space-y-1 text-gray-300 text-[11px] leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-white">YouTube Channels / Playlists</strong>: Zero permission limits, no "Request Access" screens for visitors, instant 4K/1080p loading worldwide, and gives you organic views!
                </li>
                <li>
                  <strong className="text-white">Google Drive</strong>: Ensure your folder permission is set to <em>"Anyone with the link can view"</em>. Whenever you add a new subfolder or video in Drive, it will automatically inherit this permission.
                </li>
              </ul>
            </div>

            {/* Status Indicator */}
            {sourceSyncStatus && (
              <div
                className={`p-3 rounded-lg font-mono text-xs flex items-center space-x-2 ${
                  sourceSyncStatus.startsWith("✓")
                    ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-200"
                    : sourceSyncStatus.startsWith("⚠")
                    ? "bg-amber-950/70 border border-amber-500/40 text-amber-200"
                    : "bg-blue-950/70 border border-blue-500/40 text-blue-200 animate-pulse"
                }`}
              >
                <span>{savingSource ? "⏳" : sourceSyncStatus.startsWith("✓") ? "✓" : "ℹ"}</span>
                <span>{sourceSyncStatus}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setSourceModalOpen(false);
                  setSourceSyncStatus("");
                }}
                disabled={savingSource}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#222] hover:bg-[#333] text-gray-300 font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={() => handleSaveSourceConfig(false)}
                disabled={savingSource}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2a2a2a] hover:bg-[#383838] border border-white/20 text-[#F3F0E8] font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
              >
                SAVE LINK ONLY
              </button>

              <button
                type="button"
                onClick={() => handleSaveSourceConfig(true)}
                disabled={savingSource}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 via-[#C7A56A] to-amber-600 hover:brightness-110 text-black font-mono text-xs font-bold uppercase tracking-widest rounded shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{savingSource ? "SCANNING & SYNCING..." : "⚡ SAVE & SYNC NOW"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
