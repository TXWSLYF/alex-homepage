"use client";

import type { GalleryItem } from "@/lib/gallery";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

import { useMemo } from "react";

type Props = {
  items: GalleryItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  index: number;
  setIndex: (index: number) => void;
};

type AlbumPhoto = {
  key: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  originalUrl: string | null;
};

function toAlbumPhotos(items: GalleryItem[]): AlbumPhoto[] {
  return items
    .map((it) => {
      const w = it.thumbWidth;
      const h = it.thumbHeight;
      return {
        key: it.id,
        src: it.thumbnailUrl,
        width: w,
        height: h,
        alt: it.thumbName,
        originalUrl: it.originalUrl,
      };
    })
    .filter((p) => Boolean(p.src));
}

export function GalleryAlbum({ items, open, setOpen, index, setIndex }: Props) {
  const photos = useMemo(() => toAlbumPhotos(items), [items]);

  const slides = useMemo(
    () =>
      photos.map((p) => ({
        src: p.originalUrl ?? p.src,
        alt: p.alt,
      })),
    [photos]
  );

  return (
    <>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        on={{
          view: ({ index }) => setIndex(index),
        }}
        index={index}
        slides={slides}
        plugins={[Zoom]}
        carousel={{ finite: false }}
        animation={{ fade: 180, swipe: 240 }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      />
    </>
  );
}
