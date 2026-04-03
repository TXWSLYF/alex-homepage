export type PhotoSpotlightItem = {
  id: string;
  /** 用 CSS 渐变占位，之后可换成 `src` + next/image */
  gradient: string;
  label: string;
};

/** 首页精选摄影；将 `gradient` 换为真实图片路径时再接入 next/image */
export const photoSpotlightItems: PhotoSpotlightItem[] = [
  {
    id: "1",
    label: "城市夜景",
    gradient:
      "linear-gradient(135deg, color-mix(in srgb, var(--primary) 55%, transparent) 0%, color-mix(in srgb, var(--foreground) 12%, transparent) 100%)",
  },
  {
    id: "2",
    label: "海岸",
    gradient:
      "linear-gradient(160deg, color-mix(in srgb, var(--foreground) 18%, transparent) 0%, color-mix(in srgb, var(--primary) 40%, transparent) 100%)",
  },
  {
    id: "3",
    label: "林间",
    gradient:
      "linear-gradient(200deg, color-mix(in srgb, var(--muted) 90%, transparent) 0%, color-mix(in srgb, var(--primary) 35%, transparent) 100%)",
  },
  {
    id: "4",
    label: "建筑线条",
    gradient:
      "linear-gradient(120deg, color-mix(in srgb, var(--foreground) 22%, transparent) 0%, color-mix(in srgb, var(--border) 80%, transparent) 100%)",
  },
];
