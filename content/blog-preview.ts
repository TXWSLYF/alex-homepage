export type BlogPreviewItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
};

/** Home blog preview; replace with MDX / CMS later */
export const blogPreviewItems: BlogPreviewItem[] = [
  {
    slug: "design-tokens-in-practice",
    title: "Putting design tokens into practice",
    date: "2026-03-12",
    excerpt:
      "From naming variables to dark mode—one token set to align visuals across the site.",
  },
  {
    slug: "motion-without-the-noise",
    title: "Motion: restraint beats spectacle",
    date: "2026-02-28",
    excerpt:
      "Stagger, hover, and prefers-reduced-motion for interactions that feel intentional.",
  },
];
