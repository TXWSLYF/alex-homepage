import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

function InitialThemeScript() {
  // 在构建时静态输出页面时，不能在服务端读取 cookies()，否则整站会变成动态渲染。
  // 这里用 beforeInteractive 的内联脚本在首屏渲染前读取 cookie，并切换 html.dark，避免闪烁。
  const cookieName = THEME_COOKIE;
  // Avoid template-literal interpolation pitfalls inside regexes for Turbopack parser.
  const code =
    "(function(){try{var name=" +
    JSON.stringify(cookieName) +
    ";var v=('; '+document.cookie).split('; '+name+'=').pop().split(';')[0];v=decodeURIComponent(v||'');if(v==='dark'){document.documentElement.classList.add('dark')}else if(v==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})();";

  return <Script id="initial-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
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
      <body className="relative min-h-full flex flex-col overflow-x-clip font-sans">
        <InitialThemeScript />
        <FloatingNav />
        {children}
      </body>
    </html>
  );
}
