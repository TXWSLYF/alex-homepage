/** Cookie name; keep in sync with `layout` `cookies()` and `setClientTheme` */
export const THEME_COOKIE = "theme";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Persist theme to cookie; server reads it to set `dark` on `<html>` */
export function setClientTheme(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(mode)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}
