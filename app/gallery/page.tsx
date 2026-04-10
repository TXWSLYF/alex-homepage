import type { Metadata } from "next";
import { MasonryGallery } from "../components/masonry-gallery";
import type { GalleryManifest } from "@/lib/gallery";
import manifest from "@/data/gallery.json";
import { PageIntro } from "../components/page-intro";

const data = manifest as GalleryManifest;

export const metadata: Metadata = {
  title: "Gallery — Alex",
  description: "照片集：旅行与日常光影。",
};

export default function GalleryPage() {
  return (
    <main className="relative z-1 mx-auto w-full max-w-6xl flex-1 px-6 py-24 sm:px-10">
      <div className="mb-10">
        <PageIntro
          eyebrow="Gallery"
          title="Photos"
          description="Captured moments from distant travels and quiet daily life."
        />
      </div>

      <MasonryGallery items={data.items} />
    </main>
  );
}
