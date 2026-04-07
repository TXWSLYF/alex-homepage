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
   * 缩略图实际像素尺寸（与 `thumbnailUrl` 一致，用于瀑布流 `aspect-ratio`）。
   * 必须用缩略图而非原图：原图 JPEG 常带 EXIF，存储宽高与旋转后视觉比例不一致，会导致占位框与缩略图错位。
   */
  thumbWidth?: number;
  thumbHeight?: number;
  /**
   * ThumbHash 二进制经 base64 编码（非单独文件）；前端解码为模糊占位图 data URL。
   */
  thumbHashBase64?: string;
  /**
   * @deprecated 旧版清单字段；新构建请使用 `thumbWidth` / `thumbHeight`。仅作回退。
   */
  originalWidth?: number;
  originalHeight?: number;
};

export type GalleryManifest = {
  generatedAt: string;
  publicBaseUrl: string;
  items: GalleryItem[];
};
