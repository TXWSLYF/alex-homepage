export type PhotoSpotlightItem = {
  id: string;
  /** CSS gradient placeholder; swap for `src` + next/image later */
  gradient: string;
  label: string;
};

/** Home gallery spotlight; wire next/image when using real assets */
export const photoSpotlightItems: PhotoSpotlightItem[] = [
  {
    id: "1",
    label: "City night",
    gradient:
      "linear-gradient(135deg, color-mix(in srgb, var(--primary) 55%, transparent) 0%, color-mix(in srgb, var(--foreground) 12%, transparent) 100%)",
  },
  {
    id: "2",
    label: "Coast",
    gradient:
      "linear-gradient(160deg, color-mix(in srgb, var(--foreground) 18%, transparent) 0%, color-mix(in srgb, var(--primary) 40%, transparent) 100%)",
  },
  {
    id: "3",
    label: "Forest",
    gradient:
      "linear-gradient(200deg, color-mix(in srgb, var(--muted) 90%, transparent) 0%, color-mix(in srgb, var(--primary) 35%, transparent) 100%)",
  },
  {
    id: "4",
    label: "Architecture",
    gradient:
      "linear-gradient(120deg, color-mix(in srgb, var(--foreground) 22%, transparent) 0%, color-mix(in srgb, var(--border) 80%, transparent) 100%)",
  },
];
