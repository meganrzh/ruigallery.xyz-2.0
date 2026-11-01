import { Entry } from '../types';

/**
 * Shared registry of visually oriented mediums that receive image-led archival treatment.
 */
export const IMAGE_LED_MEDIUMS = [
  'Visual Work',
  'Clothing / Upcycling',
] as const;

export type ImageLedMedium = (typeof IMAGE_LED_MEDIUMS)[number];

/**
 * Check whether a medium should receive image-led presentation.
 */
export function isImageLedMedium(medium?: string | null): boolean {
  if (!medium) return false;
  const trimmed = medium.trim();
  return (IMAGE_LED_MEDIUMS as readonly string[]).includes(trimmed);
}

export interface EntryPreviewImage {
  url: string;
  alt?: string;
  caption?: string;
}

/**
 * Deterministically resolve an entry's preview image for archival showcases:
 * 1. coverImage, if present
 * 2. otherwise first valid image block in Entry.blocks
 * 3. if neither exists, returns null for graceful text-only fallback
 */
export function getEntryPreviewImage(entry: Entry): EntryPreviewImage | null {
  // 1. coverImage, if present
  if (entry.coverImage && entry.coverImage.trim()) {
    return {
      url: entry.coverImage.trim(),
      alt: entry.coverImageAlt || entry.title,
      caption: entry.coverImageCaption,
    };
  }

  // 2. Otherwise first valid image block in Entry.blocks
  if (entry.blocks && Array.isArray(entry.blocks)) {
    for (const block of entry.blocks) {
      if (block.type === 'image' && block.url && block.url.trim()) {
        return {
          url: block.url.trim(),
          alt: block.alt || entry.title,
          caption: block.caption,
        };
      }
      if (block.type === 'two_column_images') {
        if (block.url1 && block.url1.trim()) {
          return {
            url: block.url1.trim(),
            alt: block.alt1 || entry.title,
            caption: block.caption1,
          };
        }
        if (block.url2 && block.url2.trim()) {
          return {
            url: block.url2.trim(),
            alt: block.alt2 || entry.title,
            caption: block.caption2,
          };
        }
      }
    }
  }

  // 3. Graceful fallback
  return null;
}
