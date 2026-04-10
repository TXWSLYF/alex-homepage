import type { ReactNode } from "react";

/** Shared tokens for motion layouts (e.g. home hero). */
export const pageIntroStyles = {
  eyebrow: "text-xs font-medium uppercase tracking-[0.2em] text-text-mute",
  titlePage: "text-3xl font-semibold tracking-tight text-text-main sm:text-4xl",
  titleHero: "text-4xl font-semibold tracking-tight text-text-main sm:text-5xl",
  description: "mt-3 max-w-2xl text-base leading-relaxed text-text-sub",
  meta: "mt-3 text-xs text-text-mute",
} as const;

type PageIntroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  variant?: "page" | "hero";
};

export function PageIntro({
  eyebrow,
  title,
  description,
  align = "center",
  variant = "page",
}: PageIntroProps) {
  const isCenter = align === "center";
  const titleClass =
    variant === "hero" ? pageIntroStyles.titleHero : pageIntroStyles.titlePage;

  return (
    <header
      className={
        isCenter ? "flex flex-col items-center text-center" : undefined
      }
    >
      {eyebrow ? <p className={pageIntroStyles.eyebrow}>{eyebrow}</p> : null}
      <h1
        className={`${titleClass} ${eyebrow ? "mt-2" : ""} ${isCenter ? "w-full" : ""}`}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={`${pageIntroStyles.description} ${isCenter ? "mx-auto text-pretty" : "text-pretty"}`}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
