/** Cookie 名，与 `layout` 内 `cookies()`、`setClientTheme` 保持一致 */
export const THEME_COOKIE = "theme";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 切换主题时写入 cookie；服务端根据 cookie 给 `<html>` 打 `dark` */
export function setClientTheme(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(mode)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}
