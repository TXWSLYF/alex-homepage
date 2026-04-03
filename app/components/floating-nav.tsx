"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

function subscribeTheme(callback: () => void) {
  const el = document.documentElement;
  const mo = new MutationObserver(callback);
  mo.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function useIsDarkHtml() {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function IconImage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

const links = [
  { href: "/about", label: "About", Icon: IconUser },
  { href: "/work", label: "Work", Icon: IconGrid },
  { href: "/blog", label: "Blog", Icon: IconFile },
  { href: "/gallery", label: "Gallery", Icon: IconImage },
] as const;

function navLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FloatingNav() {
  const pathname = usePathname();
  const dark = useIsDarkHtml();

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  return (
    <nav
      className="pointer-events-none fixed top-5 left-1/2 z-50 flex -translate-x-1/2 justify-center px-4"
      aria-label="主导航"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-200/80 bg-white/65 px-1.5 py-1.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-zinc-900/65 dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45),0_2px_8px_-2px_rgba(0,0,0,0.25)]">
        <Link
          href="/"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
            navLinkActive(pathname, "/")
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
          aria-current={navLinkActive(pathname, "/") ? "page" : undefined}
          title="首页"
        >
          <IconHome className="h-[18px] w-[18px]" />
        </Link>
        {links.map(({ href, label, Icon }) => {
          const active = navLinkActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900/10 text-zinc-900 dark:bg-white/15 dark:text-zinc-50"
                  : "text-zinc-700 hover:bg-zinc-900/5 dark:text-zinc-200 dark:hover:bg-white/10"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`shrink-0 ${active ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
        <span
          className="mx-0.5 h-6 w-px shrink-0 bg-zinc-200/90 dark:bg-zinc-600/80"
          aria-hidden
        />
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10"
          title={dark ? "切换为浅色" : "切换为深色"}
          aria-label={dark ? "切换为浅色模式" : "切换为深色模式"}
          suppressHydrationWarning
        >
          {dark ? (
            <IconSun className="h-[18px] w-[18px]" />
          ) : (
            <IconMoon className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </nav>
  );
}
