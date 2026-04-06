import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingNav } from "./components/floating-nav";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alex — Portfolio",
  description:
    "Full-stack engineer—UI, APIs, data, and deployment. Portfolio, blog, and gallery.",
};

function InitialThemeScript() {
  // Static export can't read server cookies; use localStorage instead.
  // This blocking head script sets `html.dark` before the first paint.
  const storageKey = JSON.stringify(THEME_STORAGE_KEY);
  const code = `(function () {
  try {
    var key = ${storageKey};
    var value = localStorage.getItem(key) || "";
    var root = document.documentElement;
    var dark = value === "dark";

    root.classList.toggle("dark", dark);
  } catch (e) {}
})();`;

  // NOTE: During static export, Next may emit CSS links before head children.
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <InitialThemeScript />
      </head>
      <body className="relative min-h-full flex flex-col overflow-x-clip font-sans">
        <FloatingNav />
        {children}
      </body>
    </html>
  );
}
