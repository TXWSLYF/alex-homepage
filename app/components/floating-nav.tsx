"use client";

import {
  BookText,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

const iconSize = 16;
const iconStroke = 1.5;

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

const links: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/about", label: "About", Icon: UserCircle },
  { href: "/work", label: "Work", Icon: LayoutGrid },
  { href: "/blog", label: "Blog", Icon: BookText },
  { href: "/gallery", label: "Gallery", Icon: ImageIcon },
];

function navLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavDivider() {
  return (
    <span
      className="mx-1 h-5 w-px shrink-0 self-center bg-zinc-200 dark:bg-zinc-600"
      aria-hidden
    />
  );
}

export function FloatingNav() {
  const pathname = usePathname();
  const dark = useIsDarkHtml();
  const homeActive = navLinkActive(pathname, "/");

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  return (
    <nav
      className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 justify-center px-4"
      aria-label="主导航"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-200/90 bg-white px-1.5 py-1 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.06)] dark:border-zinc-700/80 dark:bg-zinc-900 dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.45),0_4px_8px_-4px_rgba(0,0,0,0.35)]">
        <Link
          href="/"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            homeActive
              ? "bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
          aria-current={homeActive ? "page" : undefined}
          title="首页"
        >
          <Home aria-hidden size={iconSize} strokeWidth={iconStroke} />
        </Link>

        <NavDivider />

        <div className="flex items-center gap-1 px-0.5">
          {links.map(({ href, label, Icon }) => {
            const active = navLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
                    : "text-zinc-800 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="shrink-0 text-inherit"
                  aria-hidden
                  size={iconSize}
                  strokeWidth={iconStroke}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <NavDivider />

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title={dark ? "切换为浅色" : "切换为深色"}
          aria-label={dark ? "切换为浅色模式" : "切换为深色模式"}
          suppressHydrationWarning
        >
          {dark ? (
            <Sun aria-hidden size={iconSize} strokeWidth={iconStroke} />
          ) : (
            <Moon aria-hidden size={iconSize} strokeWidth={iconStroke} />
          )}
        </button>
      </div>
    </nav>
  );
}
