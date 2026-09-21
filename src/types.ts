/**
 * Core type definitions for ruigallery.xyz
 * Strict separation between system metadata and flexible notebook content
 */

export interface Collection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  period: string;
  order: number;
  locationContext?: string;
}

export interface Study {
  id: string;
  slug: string;
  collectionId: string;
  title: string;
  subtitle?: string;
  description: string;
  createdDate: string;
  lastModified?: string;
  threadIds: string[];
  relatedStudyIds?: string[];
  order: number;
}

export type RuiRevision = 'REV 00' | 'REV 01' | 'REV 02' | 'REV 03' | string;

export type EntryBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'fragment'; note: string; source?: string }
  | { type: 'image'; url: string; caption?: string; alt?: string; scanInfo?: string }
  | { type: 'reference'; citation: string; link?: string; year?: string }
  | { type: 'list'; items: string[]; title?: string }
  | { type: 'observation'; date?: string; coordinates?: string; text: string; label?: string }
  | { type: 'code_or_data'; title?: string; content: string; language?: string };

export const INITIAL_ENTRY_MEDIUMS = [
  'Creative Writing',
  'Clothing / Upcycling',
  'Visual Work',
  'Research / Inquiry',
] as const;

export type EntryMedium = (typeof INITIAL_ENTRY_MEDIUMS)[number] | (string & {});

export interface Entry {
  id: string;
  slug: string;
  entryNumber: string; // e.g. "001", "004", "014"
  collectionId: string;
  studyId: string;
  title: string;
  ruiRevision: RuiRevision;
  medium?: EntryMedium;
  createdDate: string;
  lastModifiedDate?: string;
  publishedDate?: string;
  location?: string;
  threadIds: string[];
  relatedStudyIds?: string[];
  summary?: string;
  blocks: EntryBlock[];
  visibility: 'published' | 'draft' | 'hidden';
}

export interface Thread {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface CuratedTextBlock {
  type: 'text';
  content: string;
}

export interface CuratedImageBlock {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
  fullWidth?: boolean;
  aspectRatio?: string;
}

export interface CuratedPullquoteBlock {
  type: 'pullquote';
  quote: string;
  attribution?: string;
}

export interface CuratedTwoColumnImagesBlock {
  type: 'two_column_images';
  url1: string;
  caption1?: string;
  alt1?: string;
  url2: string;
  caption2?: string;
  alt2?: string;
}

export type CuratedWorkBlock =
  | CuratedTextBlock
  | CuratedImageBlock
  | CuratedPullquoteBlock
  | CuratedTwoColumnImagesBlock;

export interface CuratedWork {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  workType: 'Essay' | 'Photography' | 'Visual Work' | 'Mixed Media' | 'Spatial Study';
  year: string;
  date: string;
  archivalDate: string; // Canonical machine-sortable authored date YYYY-MM-DD
  featuredOnHome: boolean;
  homeLayoutWeight: 'dominant' | 'standard' | 'editorial-compact' | 'horizontal-wide';
  coverImage: string;
  coverImageCaption?: string;
  coverImageAlt?: string;
  excerpt: string;
  bodyBlocks: CuratedWorkBlock[];
  relatedStudyIds?: string[];
  relatedEntryIds?: string[];
  metadata?: {
    medium?: string;
    dimensions?: string;
    edition?: string;
    location?: string;
    readingTime?: string;
  };
  visibility: 'published' | 'draft' | 'hidden';
  order?: number;
}

export interface ProfessionalItem {
  id: string;
  category: 'experience' | 'organization' | 'project' | 'collaboration' | 'exhibition' | 'publication';
  title: string;
  role?: string;
  entity: string;
  period: string;
  location?: string;
  description: string;
  tags?: string[];
  link?: string;
}

export interface AboutData {
  name: string;
  chineseName: string;
  title: string;
  bio: string[];
  philosophy: {
    title: string;
    propositions: {
      num: string;
      heading: string;
      body: string;
    }[];
  };
  contact: {
    email: string;
    location: string;
    links: { name: string; url: string; handle?: string }[];
  };
}

export type AppView =
  | { page: 'home' }
  | { page: 'work'; slug: string }
  | { page: 'laboratory'; filterThreadId?: string }
  | { page: 'collection'; slug: string }
  | { page: 'study'; slug: string }
  | { page: 'entry'; slug: string }
  | { page: 'archive'; initialThread?: string; initialCollection?: string }
  | { page: 'about' }
  | { page: 'admin'; subTab?: 'entries' | 'work' | 'collections' | 'threads' | 'new-entry' | 'new-work' };
