/** localStorage key used by `layout` initial theme script. */
export const THEME_STORAGE_KEY = "theme";

export type ThemeMode = "dark" | "light";

/** Persist theme to localStorage (static export friendly). */
export function setClientTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore (private mode / quota / blocked storage)
  }
}
