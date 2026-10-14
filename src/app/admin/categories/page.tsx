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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<ProjectVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);

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
      const res = await fetch("/api/drive/sync");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.projects) setProjects(data.projects);
    } catch {
      try {
        const res2 = await fetch("/api/categories");
        const data2 = await res2.json();
        if (data2.categories) setCategories(data2.categories);
      } catch {}
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
      const res = await fetch("/api/drive/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setProjects(data.projects || []);
        setSyncMessage(
          `✓ SUCCESS! Synced ${data.categoriesCount} categories and ${data.projectsCount} videos from Google Drive!`
        );
      } else {
        setSyncMessage(`⚠ Sync note: ${data.error || "Unable to sync"}`);
      }
    } catch (err: unknown) {
      setSyncMessage(
        `⚠ Sync error: ${err instanceof Error ? err.message : "Network error"}`
      );
    } finally {
      setSyncing(false);
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

      if (res.ok) {
        setEditingCat(null);
        await fetchCatsAndProjects();
      }
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this category?")) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" }).catch(() => {});
      setCategories(categories.filter((c) => c.id !== id));
      setSyncMessage("✓ Category removed from display.");
    } catch {}
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

    const vidKey = targetVideoForUpload.driveFileId || targetVideoForUpload.title || targetVideoForUpload.id;
    setUploadingForVideoId(vidKey);
    setUploadStatus(`Preparing to upload "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      // Use Chunked Upload (2MB chunks) to prevent 413 "Request Entity Too Large"
      const uploadResult = await uploadFileInChunks(file, (percent, loadedMB, totalMB) => {
        setUploadStatus(`Uploading HQ video: ${percent}% (${loadedMB} / ${totalMB} MB)...`);
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

      const dataOverride = await resOverride.json();
      if (!resOverride.ok) {
        throw new Error(dataOverride.error || "Failed to record override");
      }

      setUploadStatus("✓ Success! High-quality video replaced successfully!");
      await fetchCatsAndProjects();
      setTimeout(() => {
        setUploadStatus("");
        setUploadingForVideoId(null);
      }, 2500);
    } catch (err: unknown) {
      setUploadStatus(`⚠ Error: ${err instanceof Error ? err.message : "Upload error"}`);
      setTimeout(() => {
        setUploadingForVideoId(null);
      }, 4000);
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

      const dataUpload = await resUpload.json();
      if (!resUpload.ok || !dataUpload.url) {
        throw new Error(dataUpload.error || "Thumbnail upload failed");
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
      }, 3000);
    }
  };

  const handleSavePastedUrl = async (vid: ProjectVideo) => {
    if (!inputUrlValue.trim()) return;
    const vidKey = vid.driveFileId || vid.title || vid.id;
    setUploadingForVideoId(vidKey);
    setUploadStatus("Saving video URL replacement...");

    try {
      const res = await fetch("/api/drive/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: vidKey,
          driveFileId: vid.driveFileId,
          projectTitle: vid.title,
          projectId: vid.id,
          videoUrl: inputUrlValue.trim(),
          thumbnailUrl: vid.thumbnailUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save URL");
      }

      setEditingUrlForVideoId(null);
      setInputUrlValue("");
      setUploadStatus("✓ Video replaced with new link successfully!");
      await fetchCatsAndProjects();
      setTimeout(() => {
        setUploadStatus("");
        setUploadingForVideoId(null);
      }, 2000);
    } catch (err: unknown) {
      setUploadStatus(`⚠ Error: ${err instanceof Error ? err.message : "Error saving URL"}`);
      setTimeout(() => {
        setUploadingForVideoId(null);
      }, 3500);
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
    <div className="space-y-8 max-w-6xl">
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
          <div className="font-mono text-xs text-[#C7A56A] uppercase tracking-widest">
            CMS MODULE // GOOGLE DRIVE & HQ VIDEO REPLACEMENTS
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight">
            CATEGORIES & VIDEOS ({categories.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncWithDrive}
            disabled={syncing}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-mono text-xs font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50 rounded"
          >
            <span className={syncing ? "animate-spin" : ""}>🔄</span>
            <span>{syncing ? "SCANNING DRIVE..." : "SYNC WITH GOOGLE DRIVE"}</span>
          </button>

          <button
            onClick={() => setEditingCat({ name: "", slug: "", description: "" })}
            className="px-5 py-2.5 bg-[#C7A56A] text-[#080808] font-mono text-xs font-bold tracking-widest uppercase hover:bg-[#D8B77C] rounded"
          >
            + ADD MANUAL CATEGORY
          </button>
        </div>
      </div>

      {/* Google Drive Connection Info Card */}
      <div className="bg-[#111111] border border-[rgba(243,240,232,0.15)] p-6 space-y-4 rounded-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold tracking-widest uppercase">
                GOOGLE DRIVE AUTO-SYNC + HIGH-QUALITY VIDEO REPLACEMENT
              </span>
            </div>
            <p className="text-xs text-[#8A8A8A] max-w-3xl leading-relaxed">
              Google Drive automatically provides your categories and video library. For any video where Google Drive preview compression looks low, you can click{" "}
              <strong className="text-[#C7A56A]">"VIEW & REPLACE VIDEOS"</strong> below and either upload your uncompressed master video file (.mp4, .mov) or paste a direct high-definition link!
            </p>
          </div>

          <a
            href="https://drive.google.com/drive/folders/1qDP0lUvRfyDsvktivuDTviwKxfi67W1i"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black font-mono text-xs font-bold tracking-wider uppercase transition-all rounded shrink-0 self-start md:self-center"
          >
            OPEN ROOT DRIVE FOLDER ↗
          </a>
        </div>

        {syncMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs rounded">
            {syncMessage}
          </div>
        )}
      </div>

      {/* Modal / Form for Edit Category */}
      {editingCat && (
        <form onSubmit={handleSave} className="border border-[rgba(243,240,232,0.2)] bg-[#111111] p-6 space-y-4 font-mono text-xs rounded-xl shadow-2xl">
          <h2 className="font-display font-bold text-lg text-[#F3F0E8] uppercase">
            {editingCat.id ? "EDIT CATEGORY" : "NEW CATEGORY"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
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
            <button type="button" onClick={() => setEditingCat(null)} className="px-4 py-2 border border-[rgba(243,240,232,0.2)] text-[#8A8A8A] hover:text-[#F3F0E8] rounded">
              CANCEL
            </button>
            <button type="submit" className="px-5 py-2 bg-[#C7A56A] text-[#080808] font-bold rounded">
              SAVE CATEGORY
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
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
                const catVideoCount = projects.filter((p) => {
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
                        onClick={() => handleDelete(c.id)}
                        className="px-2.5 py-1 bg-rose-950/60 text-rose-300 hover:bg-rose-500 hover:text-white rounded transition-colors"
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
                onClick={() => setActiveCategoryForVideos(null)}
                className="px-4 py-2 bg-[#222] hover:bg-rose-900 text-white rounded-lg text-xs font-bold transition-all"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Upload Notification Banner */}
            {uploadStatus && (
              <div className="p-3 bg-amber-950/90 border-b border-amber-500/50 text-amber-200 text-xs px-6 font-bold flex items-center space-x-2">
                <span className="animate-spin">🔄</span>
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* Videos List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="text-xs text-[#8A8A8A] bg-[#161616] p-3 rounded-lg border border-white/5 leading-relaxed">
                💡 <strong className="text-white">બે ઓપ્શન્સ છે:</strong><br />
                1. <strong>"⚡ UPLOAD HQ VIDEO FILE"</strong>: તમારા કમ્પ્યુટર/મોબાઇલમાંથી ઓરિજિનલ `.mp4` કે `.mov` ફાઇલ સિલેક્ટ કરો. તે ચંક્ડ અપલોડથી ૧૦૦% સેફ અપલોડ થઈ જશે.<br />
                2. <strong>"🔗 PASTE URL"</strong>: અથવા જો વિડિયો ડ્રાઇવ કે અન્ય લિંક પર હોય તો ડાયરેક્ટ હાઇ-રિઝોલ્યુશન લિંક પેસ્ટ કરીને Save કરી શકો છો!
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
                          <div className="mt-2 p-3 bg-[#0a0a0a] border border-[#C7A56A]/30 rounded-lg flex flex-col sm:flex-row gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Paste direct high-quality video URL (MP4, MOV, Google Drive HD link)..."
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
    </div>
  );
}
