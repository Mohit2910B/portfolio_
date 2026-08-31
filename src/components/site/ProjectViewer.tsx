"use client";

import type { PublicProject } from "@/lib/data";
import VideoPlayer from "@/components/site/VideoPlayer";

export default function ProjectViewer({
  project,
  onClose,
}: {
  project: PublicProject;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Project: ${project.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-neutral-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent,#e0147f)]">
              {project.categoryLabel || "Video Project"}
            </span>
            <h3 className="font-heading text-xl font-bold uppercase text-white">
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 p-2 text-xs font-bold text-white hover:bg-white/10"
          >
            ✕ Close
          </button>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          {project.videoUrl ? (
            <VideoPlayer
              src={project.videoUrl}
              poster={project.thumbnailUrl}
              ratio={project.aspectRatio}
              autoPlay
              onClose={onClose}
            />
          ) : project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center font-mono text-xs text-white/40">
              [NO MEDIA AVAILABLE]
            </div>
          )}
        </div>

        {project.description && (
          <p className="mt-4 text-xs leading-relaxed text-white/70">
            {project.description}
          </p>
        )}
      </div>
    </div>
  );
}
