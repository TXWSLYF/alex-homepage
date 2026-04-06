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
      className="mx-1 h-5 w-px shrink-0 self-center bg-border-base/80"
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
    setClientTheme(next ? "dark" : "light");
  }, []);

  return (
    <nav
      className="pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2 justify-center px-4"
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border-base/35 bg-background/40 px-1.5 py-1 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1),0_4px_12px_-6px_rgba(0,0,0,0.06)] backdrop-blur-md backdrop-saturate-150 dark:border-white/8 dark:bg-background/25 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45),0_4px_12px_-6px_rgba(0,0,0,0.32)]">
        <Link
          href="/"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            homeActive
              ? "bg-ui-selected text-ui-selected-fg"
              : "text-text-sub hover:bg-ui-hover active:bg-ui-active"
          }`}
          aria-current={homeActive ? "page" : undefined}
          title="Home"
        >
          <Home aria-hidden size={iconSize} strokeWidth={iconStroke} />
        </Link>

        <NavDivider />

        <div className="flex items-center gap-0.5 px-0 sm:gap-1 sm:px-0.5">
          {links.map(({ href, label, Icon }) => {
            const active = navLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors sm:h-auto sm:w-auto sm:gap-1.5 sm:px-2.5 sm:py-1 ${
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
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <NavDivider />

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-sub transition-colors hover:bg-ui-hover active:bg-ui-active"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={
            dark
              ? "Switch to light color scheme"
              : "Switch to dark color scheme"
          }
          suppressHydrationWarning
        >
          {/* Avoid icon flash by letting CSS (html.dark) decide visibility. */}
          <Sun
            aria-hidden
            size={iconSize}
            strokeWidth={iconStroke}
            className="hidden dark:block"
          />
          <Moon
            aria-hidden
            size={iconSize}
            strokeWidth={iconStroke}
            className="block dark:hidden"
          />
        </button>
      </div>
    </nav>
  );
}
