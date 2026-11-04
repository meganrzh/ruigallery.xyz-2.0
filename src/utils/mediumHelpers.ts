import { Entry } from '../types';

export interface MediumDefinition {
  name: string;
  tag: string;
  description: string;
  imageLed: boolean;
}

/**
 * Single source of truth for RUI's Laboratory Medium taxonomy:
 * - Canonical Medium names
 * - Uppercase domain practice tags (at the same conceptual level)
 * - Concise, voice-aligned descriptions
 * - Image-led presentation flags (Visual Work and Clothing / Upcycling only)
 */
export const CANONICAL_MEDIUMS: Record<string, MediumDefinition> = {
  'Creative Writing': {
    name: 'Creative Writing',
    tag: 'LITERARY PRACTICE',
    description: 'Textual prose, speculative narratives, lyrical fragments, and literary inquiry.',
    imageLed: false,
  },
  'Analytical Essay': {
    name: 'Analytical Essay',
    tag: 'CRITICAL INQUIRY',
    description: 'Structured critical analysis, argumentative scholarship, and cultural critique.',
    imageLed: false,
  },
  'Research / Inquiry': {
    name: 'Research / Inquiry',
    tag: 'EPISTEMOLOGY & THEORY',
    description: 'Methodological frameworks, archival indexing, critical bibliography, and epistemic notes.',
    imageLed: false,
  },
  'Visual Work': {
    name: 'Visual Work',
    tag: 'VISUAL & MATERIAL',
    description: 'Photographic documentation, typographic surveys, architectural rubbings, and visual artifacts.',
    imageLed: true,
  },
  'Clothing / Upcycling': {
    name: 'Clothing / Upcycling',
    tag: 'TEXTILE & FORM',
    description: 'Textile construction, pattern deconstruction, material reuse, and garment studies.',
    imageLed: true,
  },
  'Curated Event': {
    name: 'Curated Event',
    tag: 'CURATORIAL PRACTICE',
    description: 'Gatherings, exhibitions, and programmed encounters composed as creative practice.',
    imageLed: false,
  },
};

/**
 * Shared registry of visually oriented mediums that receive image-led archival treatment.
 * Strictly Visual Work and Clothing / Upcycling.
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

/**
 * Resolves canonical domain tag and description for any Medium.
 */
export function getMediumDefinition(medium?: string | null): MediumDefinition {
  if (medium && CANONICAL_MEDIUMS[medium.trim()]) {
    return CANONICAL_MEDIUMS[medium.trim()];
  }
  return {
    name: medium || 'Unassigned',
    tag: 'PRACTICE',
    description: `Archival entries classified under ${medium || 'this discipline'}.`,
    imageLed: false,
  };
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
