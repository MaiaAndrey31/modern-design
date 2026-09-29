import type { GalleryItem } from "@/types/content";

/**
 * Gallery images. Real photography has not been supplied yet, so this uses
 * locally generated placeholder frames (not downloaded stock photography) to
 * demonstrate the editorial gallery layout. Replace each `src` with official
 * photography before launch — see README > "Onde colocar fotos".
 */
export const gallery: GalleryItem[] = [
  { id: "g1", src: "/images/placeholder-gallery-1.png", alt: "Alan Saher — placeholder photo 1", orientation: "landscape", isPlaceholder: true },
  { id: "g2", src: "/images/placeholder-gallery-2.png", alt: "Alan Saher — placeholder photo 2", orientation: "portrait", isPlaceholder: true },
  { id: "g3", src: "/images/placeholder-gallery-3.png", alt: "Alan Saher — placeholder photo 3", orientation: "square", isPlaceholder: true },
  { id: "g4", src: "/images/placeholder-gallery-4.png", alt: "Alan Saher — placeholder photo 4", orientation: "portrait", isPlaceholder: true },
  { id: "g5", src: "/images/placeholder-gallery-5.png", alt: "Alan Saher — placeholder photo 5", orientation: "landscape", isPlaceholder: true },
  { id: "g6", src: "/images/placeholder-gallery-6.png", alt: "Alan Saher — placeholder photo 6", orientation: "portrait", isPlaceholder: true },
  { id: "g7", src: "/images/placeholder-gallery-7.png", alt: "Alan Saher — placeholder photo 7", orientation: "square", isPlaceholder: true },
  { id: "g8", src: "/images/placeholder-gallery-8.png", alt: "Alan Saher — placeholder photo 8", orientation: "landscape", isPlaceholder: true },
];
