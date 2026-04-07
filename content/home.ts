/**
 * Shields.io 风格徽章，已下载为本地 SVG（`public/badges/*.svg`），首页不再请求 img.shields.io。
 */
export const skillBadges = [
  { alt: "Next.js", src: "/badges/nextjs.svg" },
  { alt: "React", src: "/badges/react.svg" },
  { alt: "Tailwind CSS", src: "/badges/tailwind.svg" },
  { alt: "Node.js", src: "/badges/nodejs.svg" },
  { alt: "NestJS", src: "/badges/nestjs.svg" },
  { alt: "PostgreSQL", src: "/badges/postgresql.svg" },
  { alt: "MySQL", src: "/badges/mysql.svg" },
  { alt: "Flutter", src: "/badges/flutter.svg" },
] as const;

export const homeContent = {
  name: "Alex",
  role: "Full-stack Engineer",
  eyebrow: "Portfolio",
  tagline:
    "Full-stack development—from UI to APIs, data to deployment—shipping reliable, polished products end to end.",
  ctaPrimary: { href: "/work", label: "View work" },
  ctaSecondary: { href: "/about", label: "About me" },
} as const;
