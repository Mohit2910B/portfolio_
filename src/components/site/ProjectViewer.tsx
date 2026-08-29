"use client";

import { useEffect } from "react";
import VideoPlayer from "./VideoPlayer";
import type { PublicProject } from "@/lib/data";

export default function ProjectViewer({
  project,
  onClose,
}: {
  project: PublicProject | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [project, onClose]);

  if (!project) return null;

  const isVertical = project.aspectRatio === "9:16" || project.aspectRatio === "4:5";

  const tags = (project.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className={`glass-dark fade-in relative my-auto w-full overflow-hidden rounded-[28px] p-5 sm:p-7 ${
          isVertical ? "max-w-4xl" : "max-w-5xl"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              {project.categoryLabel || "Project"}
              {project.year ? ` · ${project.year}` : ""}
            </p>
            <h2 className="display mt-1 text-xl text-white sm:text-2xl">{project.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project viewer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {isVertical ? (
          <div className="grid items-start gap-6 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr]">
            <div className="mx-auto w-full max-w-[340px] sm:max-w-[380px]">
              {project.videoUrl ? (
                <VideoPlayer
                  src={project.videoUrl}
                  poster={project.thumbnailUrl}
                  ratio={project.aspectRatio}
                  onClose={onClose}
                />
              ) : (
                <div className="grid aspect-[9/16] place-items-center rounded-2xl border border-white/15 bg-white/5 text-sm text-white/60">
                  No video attached to this project yet.
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-5">
              <div>
                {project.description && (
                  <p className="text-sm leading-relaxed text-white/75">{project.description}</p>
                )}
                {tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/15 px-3 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-white/60"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                {project.externalLink && (
                  <a
                    href={project.externalLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-accent btn-xs mt-5 inline-flex"
                  >
                    View live project
                  </a>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-[0.65rem]">
                <Meta label="Aspect ratio" value={project.aspectRatio} />
                {project.width && project.height ? (
                  <Meta label="Resolution" value={`${project.width}×${project.height}`} />
                ) : null}
                {project.durationSeconds ? (
                  <Meta label="Duration" value={`${project.durationSeconds}s`} />
                ) : null}
                {project.software ? <Meta label="Software" value={project.software} /> : null}
                {project.aiLabType ? <Meta label="AI lab" value={project.aiLabType} /> : null}
                <Meta label="Status" value={project.demoStatus === "none" ? "Released" : project.demoStatus} />
              </dl>
            </div>
          </div>
        ) : (
          <div>
            {project.videoUrl ? (
              <VideoPlayer
                src={project.videoUrl}
                poster={project.thumbnailUrl}
                ratio={project.aspectRatio}
                onClose={onClose}
              />
            ) : (
              <div className="grid aspect-video place-items-center rounded-2xl border border-white/15 bg-white/5 text-sm text-white/60">
                No video attached to this project yet.
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
              <div>
                {project.description && (
                  <p className="text-sm leading-relaxed text-white/75">{project.description}</p>
                )}
                {tags.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/15 px-3 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-white/60"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                {project.externalLink && (
                  <a
                    href={project.externalLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-accent btn-xs mt-5 inline-flex"
                  >
                    View live project
                  </a>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-[0.65rem] md:grid-cols-1">
                <Meta label="Aspect ratio" value={project.aspectRatio} />
                {project.width && project.height ? (
                  <Meta label="Resolution" value={`${project.width}×${project.height}`} />
                ) : null}
                {project.durationSeconds ? (
                  <Meta label="Duration" value={`${project.durationSeconds}s`} />
                ) : null}
                {project.software ? <Meta label="Software" value={project.software} /> : null}
                {project.aiLabType ? <Meta label="AI lab" value={project.aiLabType} /> : null}
                <Meta label="Status" value={project.demoStatus === "none" ? "Released" : project.demoStatus} />
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.55rem] uppercase tracking-[0.22em] text-white/40">{label}</dt>
      <dd className="mt-1 text-white/85">{value}</dd>
    </div>
  );
}
