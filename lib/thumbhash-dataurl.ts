import { thumbHashToDataURL } from "thumbhash";

/**
 * 将清单里的 ThumbHash（base64 编码的二进制）转为可给 `<img src>` 使用的 data URL。
 */
export function thumbHashBase64ToDataUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return thumbHashToDataURL(bytes);
}
