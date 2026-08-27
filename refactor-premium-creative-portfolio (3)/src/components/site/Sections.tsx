import Reveal from "./Reveal";
import type { SiteData } from "@/lib/data";

export function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <Reveal>
      <div className="max-w-3xl">
        <p
          className={`flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.28em] ${
            dark ? "text-white/45" : "text-ink/45"
          }`}
        >
          <span className="inline-block h-px w-8 bg-[var(--accent)]" />
          {eyebrow}
        </p>
        <h2
          className={`display mt-4 text-[clamp(2rem,5.2vw,3.6rem)] ${dark ? "text-white" : "text-ink"}`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`editorial mt-5 text-base leading-relaxed ${
              dark ? "text-white/60" : "text-ink/60"
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </Reveal>
  );
}

export function Marquee({ text }: { text: string }) {
  const items = text.split("·").map((t) => t.trim()).filter(Boolean);
  const phrase = items.length > 0 ? items : [text];
  const row = [...phrase, ...phrase, ...phrase, ...phrase];
  return (
    <div className="dark-section relative overflow-hidden border-y border-white/10 py-5">
      <div className="marquee-track whitespace-nowrap">
        <span className="flex items-center">
          {row.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center">
              <span className="display px-6 text-sm tracking-[0.22em] text-white/70">{item}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            </span>
          ))}
        </span>
        <span className="flex items-center" aria-hidden="true">
          {row.map((item, index) => (
            <span key={`dup-${item}-${index}`} className="flex items-center">
              <span className="display px-6 text-sm tracking-[0.22em] text-white/70">{item}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function AboutBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="hairline pt-5">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink/40">{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">{value}</p>
    </div>
  );
}

export function About({ data }: { data: SiteData }) {
  const { homepage } = data;
  const paragraphs = homepage.aboutIntro
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow="About" title="Editor first, designer by instinct." />
          <div className="mt-7 space-y-4">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="editorial text-lg leading-relaxed text-ink/75">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="glass mt-8 rounded-2xl p-5">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink/40">
              Availability
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink/80">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {homepage.availabilityLabel}
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <AboutBlock label="Experience" value={homepage.aboutExperience} />
          <AboutBlock label="Creative focus" value={homepage.aboutFocus} />
          <AboutBlock label="Workflow" value={homepage.aboutWorkflow} />
          <AboutBlock label="Tools" value={homepage.aboutTools} />
          <AboutBlock label="Strengths" value={homepage.aboutStrengths} />

        </div>
      </div>
    </section>
  );
}

export function Services({ data }: { data: SiteData }) {
  return (
    <section id="services" className="dark-section grain relative px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          eyebrow="Services"
          title="What I can cut, design and build for you."
          description="Every engagement is edited end-to-end: brief, structure, motion, colour, sound and delivery in the ratios you need."
          dark
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {data.services.map((service, index) => (
            <Reveal key={service.id} delay={index * 50}>
              <article className="glass-dark h-full rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="mono text-[0.6rem] tracking-[0.2em] text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="display mt-3 text-2xl text-white">{service.title}</h3>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15">
                    <ServiceIcon name={service.icon} />
                  </span>
                </div>

                {service.description && (
                  <p className="mt-4 text-sm leading-relaxed text-white/60">{service.description}</p>
                )}

                <ul className="mt-6 flex flex-wrap gap-2">
                  {service.deliverables
                    .split("|")
                    .map((d) => d.trim())
                    .filter(Boolean)
                    .map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-white/12 px-3 py-1 text-[0.58rem] uppercase tracking-[0.16em] text-white/60"
                      >
                        {item}
                      </li>
                    ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: 1.6 } as const;
  switch (name) {
    case "cut":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 4l12 16M18 4L6 20" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "shape":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="6" width="10" height="12" />
          <circle cx="17" cy="12" r="4" />
        </svg>
      );
    case "frame":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 15l5-5 4 4 3-3 6 6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </svg>
      );
    case "dial":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 12l4-4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function Footer({ data }: { data: SiteData }) {
  const { contact, homepage } = data;
  const socials = [
    { label: "Instagram", href: contact.instagram },
    { label: "YouTube", href: contact.youtube },
    { label: "LinkedIn", href: contact.linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="dark-section border-t border-white/10 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="display text-[clamp(2rem,7vw,4.5rem)] text-white">
              {homepage.heroName}
            </p>
            <p className="mono mt-4 text-[0.62rem] uppercase tracking-[0.24em] text-white/40">
              {homepage.footerNote || "Video editor · Motion graphics · AI video"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                Contact
              </p>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="link-underline mt-3 block text-sm text-white/80"
                >
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <p className="mt-2 text-sm text-white/60">
                  {contact.countryCode} {contact.phone}
                </p>
              )}
              {contact.location && (
                <p className="mt-2 text-sm text-white/60">{contact.location}</p>
              )}
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-underline mt-2 block text-sm text-white/80"
                >
                  WhatsApp
                </a>
              )}
            </div>

            {socials.length > 0 && (
              <div>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Elsewhere
                </p>
                <ul className="mt-3 space-y-2">
                  {socials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-underline text-sm text-white/80"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[0.6rem] uppercase tracking-[0.18em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {homepage.ownerName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/admin" className="link-underline">
              Admin
            </a>
            <span>{contact.responseTime}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
