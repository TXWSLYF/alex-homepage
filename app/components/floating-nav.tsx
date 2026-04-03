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
import { setClientTheme } from "@/lib/theme";
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

function useIsDarkHtml(serverDark: boolean) {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => serverDark,
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
      className="mx-1 h-5 w-px shrink-0 self-center bg-border-base/80"
      aria-hidden
    />
  );
}

export function FloatingNav({ serverDark }: { serverDark: boolean }) {
  const pathname = usePathname();
  const dark = useIsDarkHtml(serverDark);
  const homeActive = navLinkActive(pathname, "/");

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    setClientTheme(next ? "dark" : "light");
  }, []);

  return (
    <nav
      className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 justify-center px-4"
      aria-label="主导航"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border-base/90 bg-background px-1.5 py-1 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.06)] dark:border-border-base/80 dark:bg-surface-muted dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.45),0_4px_8px_-4px_rgba(0,0,0,0.35)]">
        <Link
          href="/"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            homeActive
              ? "bg-ui-selected text-ui-selected-fg"
              : "text-text-sub hover:bg-ui-hover active:bg-ui-active"
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
                    ? "bg-ui-selected text-ui-selected-fg"
                    : "text-text-sub hover:bg-ui-hover active:bg-ui-active"
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-ui-hover active:bg-ui-active"
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
