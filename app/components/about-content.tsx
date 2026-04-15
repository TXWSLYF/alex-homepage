"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Mail, MapPin } from "lucide-react";
import { homeContent } from "@/content/home";
import { pageIntroStyles } from "@/app/components/page-intro";
import { softTransition, staggerDelay } from "@/lib/motion-presets";
import { motion, useReducedMotion } from "motion/react";

type AboutLink = {
  label: string;
  href: string;
  Icon?: LucideIcon;
  variant?: "github";
};

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 496 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
    </svg>
  );
}

const about = {
  name: homeContent.name,
  role: homeContent.role,
  location: "Japan/Tokyo",
  languages: [
    { label: "Chinese", flag: "🇨🇳" },
    { label: "Japanese", flag: "🇯🇵" },
    { label: "English", flag: "🇺🇸" },
  ],
  links: [
    { label: "GitHub", href: "https://github.com/TXWSLYF", variant: "github" },
    { label: "Email", href: "mailto:19960623lyf@gmail.com", Icon: Mail },
  ] satisfies AboutLink[],
  experience: [
    {
      company: "FLY",
      role: "Senior Design Engineer",
      range: "2022 — Present",
      highlights: [
        "Redesigned key flows, improving engagement and perceived performance.",
        "Introduced lightweight AI tooling to speed up iteration loops.",
      ],
    },
    {
      company: "Creativ3",
      role: "Lead Designer",
      range: "2018 — 2022",
      highlights: [
        "Built a design system for consistent cross-platform UI.",
        "Led cross-functional delivery across product, engineering, and marketing.",
      ],
    },
  ],
} as const;

const PROTOTYPE_WIKI_URL =
  "https://en.wikipedia.org/wiki/Prototype_(video_game)";

export function AboutContent() {
  const reduced = useReducedMotion();

  let step = 0;
  const eyebrowStep = step++;
  const avatarStep = step++;
  const nameStep = step++;
  const metaStep = step++;
  const introStep = step++;
  const linksStep = step++;

  return (
    <>
      <section className="flex flex-col items-center text-center">
        <motion.p
          className={`${pageIntroStyles.eyebrow} mb-2`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, eyebrowStep),
            ...softTransition(reduced),
          }}
        >
          About
        </motion.p>

        <motion.div
          className="relative mb-6 h-24 w-24 overflow-hidden rounded-full border border-border-base"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, avatarStep),
            ...softTransition(reduced),
          }}
        >
          <Image
            src="/avatar.png"
            alt={`${about.name} avatar`}
            fill
            sizes="96px"
            priority
            className="object-cover"
          />
        </motion.div>

        <motion.h1
          className="text-4xl font-semibold tracking-tight text-text-main sm:text-5xl"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, nameStep),
            ...softTransition(reduced),
          }}
        >
          {about.name}
        </motion.h1>

        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-text-sub"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, metaStep),
            ...softTransition(reduced),
          }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-base bg-background px-3 py-1">
            <MapPin aria-hidden size={14} strokeWidth={1.5} />
            {about.location}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {about.languages.map((lang) => (
              <span
                key={lang.label}
                className="inline-flex items-center gap-2 rounded-full border border-border-base bg-background px-3 py-1"
              >
                <span aria-hidden className="text-base leading-none">
                  {lang.flag}
                </span>
                <span className="leading-none">{lang.label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-6 max-w-2xl text-base leading-relaxed text-text-sub text-pretty"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, introStep),
            ...softTransition(reduced),
          }}
        >
          <p>
            Hi, I’m Alex. I’m currently a full-stack engineer based in Tokyo,
            primarily using TypeScript-based stack. Outside of work, I enjoy
            games, anime, music, hiking, and photography.
          </p>
          <p>
            The name “Alex” comes from the video game{" "}
            <a
              href={PROTOTYPE_WIKI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-baseline font-medium text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Prototype
            </a>
            , whose protagonist is named Alex Mercer.
          </p>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: staggerDelay(reduced, linksStep),
            ...softTransition(reduced),
          }}
        >
          {about.links.map(({ label, href, Icon, variant }) => (
            <a
              key={label}
              href={href}
              className="inline-flex items-center gap-2 rounded-full border border-border-base bg-background px-4 py-2 text-sm font-medium text-text-sub transition-colors hover:bg-ui-hover active:bg-ui-active"
              target="_blank"
              rel="noopener noreferrer"
            >
              {variant === "github" ? (
                <GitHubIcon className="h-4 w-4 shrink-0 text-current" />
              ) : Icon ? (
                <Icon aria-hidden size={16} strokeWidth={1.5} />
              ) : null}
              <span>{label}</span>
            </a>
          ))}
        </motion.div>
      </section>

      <section className="mt-16">
        <motion.h2
          className="text-2xl font-semibold tracking-tight text-text-main"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={softTransition(reduced)}
        >
          Work Experience
        </motion.h2>

        <div className="mt-8 space-y-8">
          {about.experience.map((item, i) => (
            <motion.article
              key={`${item.company}-${item.range}`}
              className="rounded-3xl border border-border-base bg-background p-6"
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: reduced ? 0 : i * 0.04,
                ...softTransition(reduced),
              }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-tight text-text-main">
                    {item.company}
                  </p>
                  <p className="mt-1 text-sm text-text-sub">{item.role}</p>
                </div>
                <p className="text-sm text-text-mute">{item.range}</p>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-sub">
                {item.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>
    </>
  );
}
