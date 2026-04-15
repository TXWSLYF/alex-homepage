import type { Metadata } from "next";
import { AboutContent } from "../components/about-content";

export const metadata: Metadata = {
  title: "About — Alex",
  description: "About me ",
};

export default function AboutPage() {
  return (
    <main className="relative z-1 mx-auto w-full max-w-5xl flex-1 px-6 py-24 sm:px-10">
      <AboutContent />
    </main>
  );
}
