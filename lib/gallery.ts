/**
 * 与 `data/gallery.json` 同步的类型（由 `scripts/gallery.mjs build-json` 生成）。
 */
export type GalleryItem = {
  id: string;
  /** 缩略图文件名（如 DSC001.webp） */
  thumbName: string;
  thumbnailUrl: string;
  /** 原图 URL；若桶里只有缩略图则可能缺失 */
  originalUrl: string | null;
  /**
   * 原图像素尺寸（`gallery:build` 写入，用于瀑布流占位避免 CLS）。
   * 无原图时由缩略图探测；旧版清单可能缺省。
   */
  originalWidth?: number;
  originalHeight?: number;
};

export type GalleryManifest = {
  generatedAt: string;
  publicBaseUrl: string;
  items: GalleryItem[];
};
