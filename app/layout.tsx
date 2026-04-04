import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { FloatingNav } from "./components/floating-nav";
import { THEME_COOKIE } from "@/lib/theme";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const serverDark = themeCookie === "dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${serverDark ? " dark" : ""}`}
    >
      <body className="relative min-h-full flex flex-col font-sans">
        <FloatingNav serverDark={serverDark} />
        {children}
      </body>
    </html>
  );
}
