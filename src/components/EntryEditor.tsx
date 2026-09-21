import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  ArrowLeft,
  Image as ImageIcon,
  Quote,
  AlignLeft,
  Columns,
  Check,
  AlertCircle,
  FileText,
  Compass,
  Tag,
  Layers,
  Sparkles,
  MapPin,
  List as ListIcon,
  Bookmark,
  Code,
} from 'lucide-react';
import {
  Entry,
  EntryBlock,
  Study,
  Collection,
  Thread,
  RuiRevision,
  INITIAL_ENTRY_MEDIUMS,
} from '../types';
import { EntryReaderPreview } from './EntryReaderPreview';

interface EntryEditorProps {
  initialEntry?: Entry | null;
  entries: Entry[];
  collections: Collection[];
  studies: Study[];
  threads: Thread[];
  onSave: (entryData: Omit<Entry, 'id'>, existingId?: string) => Promise<void>;
  onCancel: () => void;
}

export const EntryEditor: React.FC<EntryEditorProps> = ({
  initialEntry,
  entries,
  collections,
  studies,
  threads,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialEntry);

  // Medium choices
  const existingMediums = Array.from(
    new Set([
      ...INITIAL_ENTRY_MEDIUMS,
      ...entries.map((e) => e.medium).filter((m): m is string => Boolean(m && m.trim())),
    ])
  );

  // Core metadata
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [subtitle, setSubtitle] = useState(initialEntry?.subtitle || '');
  const [slug, setSlug] = useState(initialEntry?.slug || '');
  const [entryNumber, setEntryNumber] = useState(
    initialEntry?.entryNumber || String(entries.length + 1).padStart(3, '0')
  );
  const [ruiRevision, setRuiRevision] = useState<RuiRevision | ''>(initialEntry?.ruiRevision || '');

  // Medium
  const [mediumChoice, setMediumChoice] = useState(() => {
    if (!initialEntry?.medium) return '__none__';
    if (existingMediums.includes(initialEntry.medium)) return initialEntry.medium;
    return '__custom__';
  });
  const [customMedium, setCustomMedium] = useState(() => {
    if (initialEntry?.medium && !existingMediums.includes(initialEntry.medium)) {
      return initialEntry.medium;
    }
    return '';
  });

  // Collection & Study (Optional)
  const [collectionId, setCollectionId] = useState<string>(initialEntry?.collectionId || '');
  const [studyId, setStudyId] = useState<string>(initialEntry?.studyId || '');

  // Dates & Location
  const [createdDate, setCreatedDate] = useState(
    initialEntry?.createdDate || new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  );
  const [displayDate, setDisplayDate] = useState(initialEntry?.displayDate || '');
  const [location, setLocation] = useState(initialEntry?.location || '');

  // Editorial & Showcase
  const [summary, setSummary] = useState(initialEntry?.summary || initialEntry?.excerpt || '');
  const [visibility, setVisibility] = useState<Entry['visibility']>(initialEntry?.visibility || 'published');
  const [featuredOnHome, setFeaturedOnHome] = useState(Boolean(initialEntry?.featuredOnHome));
  const [homeLayoutWeight, setHomeLayoutWeight] = useState<Entry['homeLayoutWeight']>(
    initialEntry?.homeLayoutWeight || 'standard'
  );
  const [coverImage, setCoverImage] = useState(initialEntry?.coverImage || '');
  const [coverImageCaption, setCoverImageCaption] = useState(initialEntry?.coverImageCaption || '');
  const [coverImageAlt, setCoverImageAlt] = useState(initialEntry?.coverImageAlt || '');

  // Metadata
  const [readingTime, setReadingTime] = useState(initialEntry?.metadata?.readingTime || '');
  const [dimensions, setDimensions] = useState(initialEntry?.metadata?.dimensions || '');
  const [edition, setEdition] = useState(initialEntry?.metadata?.edition || '');

  // Relationships
  const [threadIds, setThreadIds] = useState<string[]>(initialEntry?.threadIds || []);
  const [relatedStudyIds, setRelatedStudyIds] = useState<string[]>(initialEntry?.relatedStudyIds || []);
  const [relatedEntryIds, setRelatedEntryIds] = useState<string[]>(initialEntry?.relatedEntryIds || []);

  // Blocks
  const [blocks, setBlocks] = useState<EntryBlock[]>(() => {
    if (initialEntry?.blocks && initialEntry.blocks.length > 0) {
      return JSON.parse(JSON.stringify(initialEntry.blocks));
    }
    return [
      {
        type: 'paragraph',
        content: 'Write archival notebook or essay prose here...',
      },
    ];
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showReaderPreview, setShowReaderPreview] = useState(false);

  // Auto-slug generator on title edit for new entries
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug.startsWith('entry-'))) {
      const generated = `entry-${entryNumber}-${val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`;
      setSlug(generated);
    }
  };

  // Block management
  const addBlock = (block: EntryBlock) => {
    setBlocks((prev) => [...prev, block]);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...blocks];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;
    setBlocks(copy);
  };

  const updateBlockAt = (index: number, updated: EntryBlock) => {
    const copy = [...blocks];
    copy[index] = updated;
    setBlocks(copy);
  };

  // Save handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter an Entry Title.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    let finalMedium: string | undefined = undefined;
    if (mediumChoice === '__custom__') {
      finalMedium = customMedium.trim() || undefined;
    } else if (mediumChoice && mediumChoice !== '__none__') {
      finalMedium = mediumChoice.trim() || undefined;
    }

    const payload: Omit<Entry, 'id'> = {
      slug: slug.trim() || `entry-${entryNumber}`,
      entryNumber: entryNumber.trim() || '000',
      collectionId: collectionId.trim() || undefined,
      studyId: studyId.trim() || undefined,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      ruiRevision: ruiRevision ? (ruiRevision as RuiRevision) : null,
      medium: finalMedium,
      createdDate: createdDate.trim(),
      publishedDate: createdDate.trim(),
      displayDate: displayDate.trim() || undefined,
      location: location.trim() || undefined,
      threadIds,
      relatedStudyIds,
      relatedEntryIds,
      summary: summary.trim() || undefined,
      excerpt: summary.trim() || undefined,
      blocks,
      visibility,
      featuredOnHome,
      homeLayoutWeight,
      coverImage: coverImage.trim() || undefined,
      coverImageCaption: coverImageCaption.trim() || undefined,
      coverImageAlt: coverImageAlt.trim() || undefined,
      metadata: {
        ...(readingTime ? { readingTime } : {}),
        ...(dimensions ? { dimensions } : {}),
        ...(edition ? { edition } : {}),
        ...(location ? { location } : {}),
        ...(finalMedium ? { medium: finalMedium } : {}),
      },
    };

    try {
      await onSave(payload, initialEntry?.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving entry';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter studies by selected collection if collection is selected
  const availableStudies = collectionId
    ? studies.filter((s) => s.collectionId === collectionId)
    : studies;

  return (
    <div className="space-y-8 animate-fade-in font-mono-archival text-xs">
      {/* Top Action Bar */}
      <div className="bg-[#F4F3EE] border border-[#E5E3DB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-[#EAE8E0] text-[#6E6E66] hover:text-[#141413] transition-colors border border-transparent hover:border-[#E5E3DB]"
            title="Cancel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#8C8C82] uppercase tracking-wider">
              <span>UNIFIED CMS</span>
              <span>•</span>
              <span className="text-[#9E2A2B] font-semibold">
                {isEditing ? `EDIT ENTRY ${entryNumber}` : 'AUTHOR NEW ENTRY'}
              </span>
            </div>
            <h2 className="font-serif text-lg text-[#141413] font-medium truncate max-w-md">
              {title || 'Untitled Archival Entry'}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowReaderPreview(true)}
            className="px-3 py-1.5 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span>Reader Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-1.5 bg-[#9E2A2B] hover:bg-[#801C1D] text-[#FBFBFA] flex items-center space-x-1.5 font-medium transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Update Entry' : 'Publish Entry'}</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Archival Identity */}
        <section className="bg-[#FBFBFA] border border-[#E5E3DB] p-6 space-y-6">
          <div className="pb-3 border-b border-[#E5E3DB] flex items-center justify-between">
            <h3 className="font-serif text-base text-[#141413] font-medium flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#9E2A2B]" />
              <span>1. Archival Identity & Classification</span>
            </h3>
            <span className="text-[10px] text-[#8C8C82] uppercase">Core Metadata</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Title */}
            <div className="md:col-span-8">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Entry Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. The Shape of Drift: On Tidal Erosion & Coastal Memory"
                className="w-full p-2.5 bg-[#F4F3EE] border border-[#E5E3DB] font-serif text-lg text-[#141413] focus:border-[#141413] focus:outline-hidden"
                required
              />
            </div>

            {/* Entry Number */}
            <div className="md:col-span-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Catalog # *
              </label>
              <input
                type="text"
                value={entryNumber}
                onChange={(e) => setEntryNumber(e.target.value)}
                placeholder="019"
                className="w-full p-2.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
                required
              />
            </div>

            {/* Visibility */}
            <div className="md:col-span-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Visibility Status
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Entry['visibility'])}
                className="w-full p-2.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Subtitle */}
            <div className="md:col-span-8">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Subtitle / Secondary Descriptor
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Field observations on littoral geology and structural decay"
                className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] font-serif text-sm text-[#141413]"
              />
            </div>

            {/* Slug */}
            <div className="md:col-span-4">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
                required
              />
            </div>

            {/* Creative Medium Classification */}
            <div className="md:col-span-6 p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
              <label className="block text-[#141413] text-[11px] font-semibold uppercase flex items-center justify-between">
                <span>Creative Medium Classification</span>
                <span className="text-[#8C8C82] text-[10px] font-normal">Controls Laboratory Filter</span>
              </label>
              <select
                value={mediumChoice}
                onChange={(e) => setMediumChoice(e.target.value)}
                className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
              >
                <option value="__none__">(No Medium Assigned / Unclassified)</option>
                {existingMediums.map((med) => (
                  <option key={med} value={med}>
                    {med}
                  </option>
                ))}
                <option value="__custom__">+ Custom / New Medium...</option>
              </select>

              {mediumChoice === '__custom__' && (
                <input
                  type="text"
                  placeholder="e.g. Architectural Casting, Sound Recording..."
                  value={customMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                  className="w-full p-2 bg-[#FBFBFA] border border-[#141413] text-[#141413]"
                  autoFocus
                />
              )}
            </div>

            {/* RUI Revision */}
            <div className="md:col-span-3 p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
              <label className="block text-[#141413] text-[11px] font-semibold uppercase">
                RUI Revision
              </label>
              <select
                value={ruiRevision}
                onChange={(e) => setRuiRevision(e.target.value as RuiRevision | '')}
                className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
              >
                <option value="">(None / Unassigned - Migrated Works)</option>
                <option value="REV 00">REV 00 (Initial State)</option>
                <option value="REV 01">REV 01 (Major Maturation)</option>
                <option value="REV 02">REV 02 (Expanded Fieldwork)</option>
                <option value="REV 03">REV 03 (Resolved Thesis)</option>
              </select>
            </div>

            {/* Created Date / Display Date */}
            <div className="md:col-span-3 p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
              <label className="block text-[#141413] text-[11px] font-semibold uppercase">
                Archival Date
              </label>
              <input
                type="text"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                placeholder="2026.10.14"
                className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Study / Collection Context & Conceptual Threads */}
        <section className="bg-[#FBFBFA] border border-[#E5E3DB] p-6 space-y-6">
          <div className="pb-3 border-b border-[#E5E3DB] flex items-center justify-between">
            <h3 className="font-serif text-base text-[#141413] font-medium flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#9E2A2B]" />
              <span>2. Research Context & Relations</span>
            </h3>
            <span className="text-[10px] text-[#8C8C82] uppercase">Optional Inquiries</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Collection */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Collection Assignment
              </label>
              <select
                value={collectionId}
                onChange={(e) => {
                  setCollectionId(e.target.value);
                  // Reset study if not in this collection
                  if (e.target.value) {
                    const validInCol = studies.some(
                      (s) => s.id === studyId && s.collectionId === e.target.value
                    );
                    if (!validInCol) setStudyId('');
                  }
                }}
                className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
              >
                <option value="">(Independent / No Collection)</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Study */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Primary Study Assignment
              </label>
              <select
                value={studyId}
                onChange={(e) => setStudyId(e.target.value)}
                className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
              >
                <option value="">(Independent / No Study)</option>
                {availableStudies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Location / Coordinate */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Location / Coordinate
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Venice (Dorsoduro)"
                className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
              />
            </div>
          </div>

          {/* Conceptual Threads Multi-Select */}
          <div className="pt-3 border-t border-[#EFEFEA] space-y-2">
            <label className="block text-[#8C8C82] text-[10px] uppercase">
              Assign Conceptual Threads
            </label>
            <div className="flex flex-wrap gap-2">
              {threads.map((t) => {
                const isChecked = threadIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`px-2.5 py-1 border cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-[#9E2A2B] text-[#FBFBFA] border-[#9E2A2B]'
                        : 'bg-[#F4F3EE] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setThreadIds(threadIds.filter((id) => id !== t.id));
                        } else {
                          setThreadIds([...threadIds, t.id]);
                        }
                      }}
                    />
                    #{t.name}
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Editorial Showcase & Homepage Featuring */}
        <section className="bg-[#FBFBFA] border border-[#E5E3DB] p-6 space-y-6">
          <div className="pb-3 border-b border-[#E5E3DB] flex items-center justify-between">
            <h3 className="font-serif text-base text-[#141413] font-medium flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#9E2A2B]" />
              <span>3. Editorial Showcase & Homepage Presentation</span>
            </h3>
            <span className="text-[10px] text-[#8C8C82] uppercase">Homepage Grid</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Featuring Toggles */}
            <div className="md:col-span-6 p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#141413] text-xs block">
                    Feature on Homepage Grid
                  </span>
                  <span className="text-[10px] text-[#8C8C82]">
                    Display this Entry directly in the curated showcase on the home page.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeaturedOnHome(!featuredOnHome)}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    featuredOnHome
                      ? 'bg-[#141413] text-[#FBFBFA] border-[#141413]'
                      : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB]'
                  }`}
                >
                  {featuredOnHome ? 'FEATURED' : 'NOT FEATURED'}
                </button>
              </div>

              {featuredOnHome && (
                <div className="pt-3 border-t border-[#E5E3DB]">
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    Homepage Layout Weight
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHomeLayoutWeight('dominant')}
                      className={`p-2 border text-center transition-colors ${
                        homeLayoutWeight === 'dominant'
                          ? 'bg-[#141413] text-[#FBFBFA] border-[#141413]'
                          : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB]'
                      }`}
                    >
                      <span className="block font-semibold text-xs">Dominant Hero</span>
                      <span className="text-[10px] text-gray-400">Large feature spot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHomeLayoutWeight('standard')}
                      className={`p-2 border text-center transition-colors ${
                        homeLayoutWeight === 'standard'
                          ? 'bg-[#141413] text-[#FBFBFA] border-[#141413]'
                          : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB]'
                      }`}
                    >
                      <span className="block font-semibold text-xs">Standard Grid</span>
                      <span className="text-[10px] text-gray-400">3-column grid item</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Date & Excerpt */}
            <div className="md:col-span-6 space-y-3">
              <div>
                <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                  Display Date (Editorial)
                </label>
                <input
                  type="text"
                  value={displayDate}
                  onChange={(e) => setDisplayDate(e.target.value)}
                  placeholder="e.g. October 2026"
                  className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
                />
              </div>

              <div>
                <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                  Summary / Thesis Excerpt
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A concise summary or thesis opening for teasers and homepage cards..."
                  className="w-full p-2 bg-[#F4F3EE] border border-[#E5E3DB] font-serif text-sm text-[#141413]"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="md:col-span-12 p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-3">
              <label className="block text-[#141413] text-[11px] font-semibold uppercase">
                Featured Cover Image
              </label>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8 space-y-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or relative URL"
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={coverImageCaption}
                      onChange={(e) => setCoverImageCaption(e.target.value)}
                      placeholder="Image Caption (optional)"
                      className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] text-[11px]"
                    />
                    <input
                      type="text"
                      value={coverImageAlt}
                      onChange={(e) => setCoverImageAlt(e.target.value)}
                      placeholder="Image Alt Text (optional)"
                      className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] text-[11px]"
                    />
                  </div>
                </div>

                <div className="md:col-span-4">
                  {coverImage ? (
                    <div className="relative border border-[#E5E3DB] bg-[#EAE8E0] h-28 overflow-hidden">
                      <img
                        src={coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-28 border border-dashed border-[#E5E3DB] bg-[#FBFBFA] flex items-center justify-center text-[#8C8C82] text-[10px]">
                      No cover image specified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Universal Content Blocks */}
        <section className="bg-[#FBFBFA] border border-[#E5E3DB] p-6 space-y-6">
          <div className="pb-3 border-b border-[#E5E3DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base text-[#141413] font-medium flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#9E2A2B]" />
                <span>4. Archival Content Blocks ({blocks.length})</span>
              </h3>
              <span className="text-[10px] text-[#8C8C82]">
                Universal block library for essays, fieldwork notebooks, images, and research data.
              </span>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => addBlock({ type: 'paragraph', content: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <AlignLeft className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Paragraph</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'pullquote', quote: '', attribution: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <Quote className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Pullquote</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'image', url: '', caption: '', alt: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <ImageIcon className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Image</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  addBlock({
                    type: 'two_column_images',
                    url1: '',
                    caption1: '',
                    url2: '',
                    caption2: '',
                  })
                }
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <Columns className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ 2 Col Images</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'fragment', note: '', source: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <FileText className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Fragment</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'observation', coordinates: '', text: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <MapPin className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Observation</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'list', items: ['Item 1', 'Item 2'] })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <ListIcon className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ List</span>
              </button>
              <button
                type="button"
                onClick={() => addBlock({ type: 'reference', citation: '', link: '' })}
                className="px-2 py-1 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] flex items-center space-x-1"
              >
                <Bookmark className="w-3 h-3 text-[#9E2A2B]" />
                <span>+ Ref</span>
              </button>
            </div>
          </div>

          {/* Block List */}
          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-[#8C8C82] pb-2 border-b border-[#E5E3DB]">
                  <span className="font-semibold text-[#141413] text-xs">
                    BLOCK {idx + 1}: {block.type.toUpperCase().replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-[#EAE8E0] text-[#6E6E66] disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(idx, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="p-1 hover:bg-[#EAE8E0] text-[#6E6E66] disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(idx)}
                      className="p-1 hover:bg-red-50 text-red-700 ml-2"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Editors */}
                {(block.type === 'paragraph' || block.type === 'text') && (
                  <textarea
                    rows={4}
                    value={block.content}
                    onChange={(e) => updateBlockAt(idx, { ...block, content: e.target.value })}
                    placeholder="Write narrative prose or body paragraph..."
                    className="w-full p-2.5 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base text-[#141413]"
                  />
                )}

                {block.type === 'pullquote' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={block.quote}
                      onChange={(e) => updateBlockAt(idx, { ...block, quote: e.target.value })}
                      placeholder="Emphasized pullquote or excerpt..."
                      className="w-full p-2.5 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-lg italic text-[#141413]"
                    />
                    <input
                      type="text"
                      value={block.attribution || ''}
                      onChange={(e) => updateBlockAt(idx, { ...block, attribution: e.target.value })}
                      placeholder="Attribution / Citation source (optional)"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#6E6E66]"
                    />
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.url}
                      onChange={(e) => updateBlockAt(idx, { ...block, url: e.target.value })}
                      placeholder="Image URL"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                    <input
                      type="text"
                      value={block.caption || ''}
                      onChange={(e) => updateBlockAt(idx, { ...block, caption: e.target.value })}
                      placeholder="Image Caption"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                    {block.url && (
                      <div className="h-32 bg-[#EAE8E0] overflow-hidden border border-[#E5E3DB] max-w-xs">
                        <img src={block.url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'two_column_images' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2">
                      <span className="text-[10px] text-[#8C8C82] block">Column 1 Image</span>
                      <input
                        type="text"
                        value={block.url1}
                        onChange={(e) => updateBlockAt(idx, { ...block, url1: e.target.value })}
                        placeholder="Image 1 URL"
                        className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[11px]"
                      />
                      <input
                        type="text"
                        value={block.caption1 || ''}
                        onChange={(e) => updateBlockAt(idx, { ...block, caption1: e.target.value })}
                        placeholder="Image 1 Caption"
                        className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[11px]"
                      />
                    </div>
                    <div className="p-2 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2">
                      <span className="text-[10px] text-[#8C8C82] block">Column 2 Image</span>
                      <input
                        type="text"
                        value={block.url2}
                        onChange={(e) => updateBlockAt(idx, { ...block, url2: e.target.value })}
                        placeholder="Image 2 URL"
                        className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[11px]"
                      />
                      <input
                        type="text"
                        value={block.caption2 || ''}
                        onChange={(e) => updateBlockAt(idx, { ...block, caption2: e.target.value })}
                        placeholder="Image 2 Caption"
                        className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'fragment' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={block.note}
                      onChange={(e) => updateBlockAt(idx, { ...block, note: e.target.value })}
                      placeholder="Fragment text or field notation..."
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base italic text-[#141413]"
                    />
                    <input
                      type="text"
                      value={block.source || ''}
                      onChange={(e) => updateBlockAt(idx, { ...block, source: e.target.value })}
                      placeholder="Source / Notebook reference"
                      className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#6E6E66]"
                    />
                  </div>
                )}

                {block.type === 'observation' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.coordinates || ''}
                      onChange={(e) => updateBlockAt(idx, { ...block, coordinates: e.target.value })}
                      placeholder="Coordinates or site indicator (e.g. 45.4408° N, 12.3155° E)"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                    <textarea
                      rows={2}
                      value={block.text}
                      onChange={(e) => updateBlockAt(idx, { ...block, text: e.target.value })}
                      placeholder="Observation narrative..."
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-sm"
                    />
                  </div>
                )}

                {block.type === 'list' && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      {block.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center space-x-2">
                          <span className="text-[#8C8C82]">•</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const copy = [...block.items];
                              copy[itemIdx] = e.target.value;
                              updateBlockAt(idx, { ...block, items: copy });
                            }}
                            className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = block.items.filter((_, i) => i !== itemIdx);
                              updateBlockAt(idx, { ...block, items: copy });
                            }}
                            className="text-red-700 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateBlockAt(idx, { ...block, items: [...block.items, 'New list item'] })
                      }
                      className="text-[11px] text-[#9E2A2B] hover:underline"
                    >
                      + Add List Item
                    </button>
                  </div>
                )}

                {block.type === 'reference' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.citation}
                      onChange={(e) => updateBlockAt(idx, { ...block, citation: e.target.value })}
                      placeholder="Bibliographic citation / archival source"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                    <input
                      type="text"
                      value={block.link || ''}
                      onChange={(e) => updateBlockAt(idx, { ...block, link: e.target.value })}
                      placeholder="External reference URL (optional)"
                      className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Cross-Reference Relations */}
        <section className="bg-[#FBFBFA] border border-[#E5E3DB] p-6 space-y-4">
          <div className="pb-3 border-b border-[#E5E3DB] flex items-center justify-between">
            <h3 className="font-serif text-base text-[#141413] font-medium flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#9E2A2B]" />
              <span>5. Cross-Referenced Entries & Studies</span>
            </h3>
            <span className="text-[10px] text-[#8C8C82] uppercase">Cross-Disciplinary Web</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Related Studies */}
            <div className="space-y-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase">
                Cross-Referenced Studies ({relatedStudyIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto border border-[#E5E3DB] p-2 bg-[#F4F3EE] space-y-1">
                {studies.map((s) => {
                  const checked = relatedStudyIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center space-x-2 text-xs p-1.5 hover:bg-[#FBFBFA] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setRelatedStudyIds(relatedStudyIds.filter((id) => id !== s.id));
                          } else {
                            setRelatedStudyIds([...relatedStudyIds, s.id]);
                          }
                        }}
                      />
                      <span className="truncate">{s.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Related Entries */}
            <div className="space-y-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase">
                Cross-Referenced Archival Entries ({relatedEntryIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto border border-[#E5E3DB] p-2 bg-[#F4F3EE] space-y-1">
                {entries
                  .filter((e) => e.id !== initialEntry?.id)
                  .map((e) => {
                    const checked = relatedEntryIds.includes(e.id);
                    return (
                      <label
                        key={e.id}
                        className="flex items-center space-x-2 text-xs p-1.5 hover:bg-[#FBFBFA] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setRelatedEntryIds(relatedEntryIds.filter((id) => id !== e.id));
                            } else {
                              setRelatedEntryIds([...relatedEntryIds, e.id]);
                            }
                          }}
                        />
                        <span className="text-[#8C8C82] shrink-0">#{e.entryNumber}</span>
                        <span className="truncate">{e.title}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Action Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-[#E5E3DB]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#E5E3DB] bg-[#FBFBFA] hover:bg-[#EAE8E0] text-[#6E6E66]"
          >
            Cancel & Return
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowReaderPreview(true)}
              className="px-4 py-2 border border-[#E5E3DB] bg-[#FBFBFA] hover:border-[#141413] text-[#141413] flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>Reader Preview</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-[#9E2A2B] hover:bg-[#801C1D] text-[#FBFBFA] flex items-center space-x-2 font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Entry'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Reader Preview Modal */}
      {showReaderPreview && (
        <EntryReaderPreview
          entry={{
            id: initialEntry?.id,
            slug: slug || 'preview-entry',
            entryNumber,
            collectionId,
            studyId,
            title: title || 'Untitled Entry',
            subtitle,
            ruiRevision: ruiRevision ? (ruiRevision as RuiRevision) : null,
            medium:
              mediumChoice === '__custom__'
                ? customMedium
                : mediumChoice !== '__none__'
                ? mediumChoice
                : 'Research / Inquiry',
            createdDate,
            publishedDate: createdDate,
            displayDate,
            location,
            threadIds,
            relatedStudyIds,
            relatedEntryIds,
            summary,
            excerpt: summary,
            blocks,
            visibility,
            featuredOnHome,
            homeLayoutWeight,
            coverImage,
            coverImageCaption,
            coverImageAlt,
            metadata: {
              ...(readingTime ? { readingTime } : {}),
              ...(dimensions ? { dimensions } : {}),
              ...(edition ? { edition } : {}),
              ...(location ? { location } : {}),
            },
          }}
          collection={collections.find((c) => c.id === collectionId)}
          study={studies.find((s) => s.id === studyId)}
          threads={threads.filter((t) => threadIds.includes(t.id))}
          relatedStudies={studies.filter((s) => relatedStudyIds.includes(s.id))}
          relatedEntries={entries.filter((e) => relatedEntryIds.includes(e.id))}
          onClose={() => setShowReaderPreview(false)}
        />
      )}
    </div>
  );
};
