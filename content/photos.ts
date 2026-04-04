const R2_BASE =
  "https://pub-98482c38eca64dbe97c319bbed26cad3.r2.dev/gallery/thumbs/1600w";

export type PhotoSpotlightItem = {
  id: string;
  src: string;
  label: string;
  /** Optional longer description for `alt`; defaults to `label` */
  alt?: string;
};

/** Home gallery spotlight */
export const photoSpotlightItems: PhotoSpotlightItem[] = [
  {
    id: "1",
    label: "Cherry blossoms",
    src: `${R2_BASE}/DSC08810.webp`,
  },
  {
    id: "2",
    label: "Mount Fuji & coast",
    src: `${R2_BASE}/DSC01133.webp`,
  },
  {
    id: "3",
    label: "Torii & street",
    src: `${R2_BASE}/DSC08862.webp`,
  },
  {
    id: "4",
    label: "Kingfisher",
    src: `${R2_BASE}/DSC03079.webp`,
  },
];
