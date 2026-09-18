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
} from 'lucide-react';
import {
  CuratedWork,
  CuratedWorkBlock,
  CuratedTextBlock,
  CuratedPullquoteBlock,
  CuratedImageBlock,
  CuratedTwoColumnImagesBlock,
  Study,
  Entry,
} from '../types';
import { CuratedWorkReaderPreview } from './CuratedWorkReaderPreview';

interface CuratedWorkEditorProps {
  initialWork?: CuratedWork | null;
  studies: Study[];
  entries: Entry[];
  onSave: (workData: Omit<CuratedWork, 'id'>, existingId?: string) => Promise<void>;
  onCancel: () => void;
}

export const CuratedWorkEditor: React.FC<CuratedWorkEditorProps> = ({
  initialWork,
  studies,
  entries,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialWork);

  // Core metadata state
  const [title, setTitle] = useState(initialWork?.title || '');
  const [subtitle, setSubtitle] = useState(initialWork?.subtitle || '');
  const [slug, setSlug] = useState(initialWork?.slug || '');
  const [workType, setWorkType] = useState<CuratedWork['workType']>(initialWork?.workType || 'Essay');
  const [year, setYear] = useState(initialWork?.year || new Date().getFullYear().toString());
  const [date, setDate] = useState(
    initialWork?.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );
  const [featuredOnHome, setFeaturedOnHome] = useState(Boolean(initialWork?.featuredOnHome));
  const [homeLayoutWeight, setHomeLayoutWeight] = useState<CuratedWork['homeLayoutWeight']>(
    initialWork?.homeLayoutWeight || 'standard'
  );
  const [coverImage, setCoverImage] = useState(initialWork?.coverImage || '');
  const [excerpt, setExcerpt] = useState(initialWork?.excerpt || '');
  const [visibility, setVisibility] = useState<CuratedWork['visibility']>(initialWork?.visibility || 'published');

  // Extended metadata state
  const [readingTime, setReadingTime] = useState(initialWork?.metadata?.readingTime || '');
  const [medium, setMedium] = useState(initialWork?.metadata?.medium || '');
  const [dimensions, setDimensions] = useState(initialWork?.metadata?.dimensions || '');
  const [location, setLocation] = useState(initialWork?.metadata?.location || '');
  const [edition, setEdition] = useState(initialWork?.metadata?.edition || '');

  // Associations state
  const [relatedStudyIds, setRelatedStudyIds] = useState<string[]>(initialWork?.relatedStudyIds || []);
  const [relatedEntryIds, setRelatedEntryIds] = useState<string[]>(initialWork?.relatedEntryIds || []);

  // Body blocks state
  const [bodyBlocks, setBodyBlocks] = useState<CuratedWorkBlock[]>(() => {
    if (initialWork?.bodyBlocks && initialWork.bodyBlocks.length > 0) {
      return JSON.parse(JSON.stringify(initialWork.bodyBlocks));
    }
    return [
      {
        type: 'text',
        content: 'Write continuous prose sections for the curated work here. Paragraphs and line breaks will be preserved with archival typesetting.',
      },
    ];
  });

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showReaderPreview, setShowReaderPreview] = useState(false);

  // Auto-slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  // Block management
  const addProseBlock = () => {
    setBodyBlocks((prev) => [...prev, { type: 'text', content: '' }]);
  };

  const addPullquoteBlock = () => {
    setBodyBlocks((prev) => [...prev, { type: 'pullquote', quote: '', attribution: '' }]);
  };

  const addImageBlock = () => {
    setBodyBlocks((prev) => [
      ...prev,
      {
        type: 'image',
        url: '',
        caption: '',
        alt: '',
        aspectRatio: 'standard',
      },
    ]);
  };

  const addTwoColumnImagesBlock = () => {
    setBodyBlocks((prev) => [
      ...prev,
      {
        type: 'two_column_images',
        url1: '',
        caption1: '',
        alt1: '',
        url2: '',
        caption2: '',
        alt2: '',
      },
    ]);
  };

  const removeBlock = (index: number) => {
    setBodyBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    setBodyBlocks((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateBlock = (index: number, updated: CuratedWorkBlock) => {
    setBodyBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  // Build current work object for preview or save
  const currentWorkObject: CuratedWork = {
    id: initialWork?.id || `work-${slug || Date.now()}`,
    slug: slug.trim() || 'untitled-work',
    title: title.trim(),
    subtitle: subtitle.trim() || undefined,
    workType,
    year: year.trim(),
    date: date.trim(),
    featuredOnHome,
    homeLayoutWeight,
    coverImage: coverImage.trim(),
    excerpt: excerpt.trim(),
    bodyBlocks,
    metadata: {
      readingTime: readingTime.trim() || undefined,
      medium: medium.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      location: location.trim() || undefined,
      edition: edition.trim() || undefined,
    },
    relatedStudyIds,
    relatedEntryIds,
    visibility,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!slug.trim()) {
      setFormError('Slug is required');
      return;
    }
    if (!coverImage.trim()) {
      setFormError('Cover image URL is required');
      return;
    }
    if (!excerpt.trim()) {
      setFormError('Lead excerpt is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          slug: slug.trim().toLowerCase(),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          workType,
          year: year.trim(),
          date: date.trim(),
          featuredOnHome,
          homeLayoutWeight,
          coverImage: coverImage.trim(),
          excerpt: excerpt.trim(),
          bodyBlocks,
          metadata: {
            readingTime: readingTime.trim() || undefined,
            medium: medium.trim() || undefined,
            dimensions: dimensions.trim() || undefined,
            location: location.trim() || undefined,
            edition: edition.trim() || undefined,
          },
          relatedStudyIds,
          relatedEntryIds,
          visibility,
        },
        initialWork?.id
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database mutation failed to persist.';
      setFormError(`Failed to save curated work to D1: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const previewRelatedStudies = studies.filter((s) => relatedStudyIds.includes(s.id));
  const previewRelatedEntries = entries.filter((e) => relatedEntryIds.includes(e.id));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#141413] text-[#FBFBFA] border border-[#141413]">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 bg-[#2C2C28] hover:bg-[#3C3C38] text-[#8C8C82] hover:text-[#FBFBFA] border border-[#4A4A44] transition-colors"
            title="Return to Works List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono-archival text-[#8C8C82]">
              <span className="text-[#9E2A2B] font-semibold">
                {isEditing ? `[ EDITING WORK: ${initialWork?.id} ]` : '[ NEW CURATED WORK ]'}
              </span>
              <span>•</span>
              <span>STRUCTURED D1 AUTHORING</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium mt-0.5">
              {title || (isEditing ? 'Edit Curated Work' : 'Author New Curated Work')}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowReaderPreview(true)}
            className="px-3.5 py-1.5 bg-[#2C2C28] hover:bg-[#3C3C38] text-[#FBFBFA] border border-[#4A4A44] text-xs font-mono-archival flex items-center space-x-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span>Preview as Reader</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-1.5 bg-[#9E2A2B] hover:bg-[#801C1D] disabled:opacity-50 text-[#FBFBFA] text-xs font-mono-archival uppercase tracking-wider font-semibold transition-colors flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to D1...' : isEditing ? 'Save Changes' : 'Publish Work'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="p-4 bg-red-950/20 border border-red-800 text-red-300 text-xs font-mono-archival flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {formError}
          </div>
        </div>
      )}

      {/* Main Authoring Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Archival Identity */}
        <div className="p-6 bg-[#FBFBFA] border border-[#E5E3DB] space-y-6">
          <h3 className="font-serif text-lg text-[#141413] font-medium pb-2 border-b border-[#E5E3DB] flex items-center justify-between">
            <span>1. Core Archival Identity</span>
            <span className="text-xs font-mono-archival text-[#8C8C82] font-normal">Primary Index Metadata</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono-archival">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Work Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Tactile Cartography of Kyoto"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413] font-serif text-base focus:border-[#141413] focus:outline-hidden"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">URL Slug (Unique) *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="tactile-cartography-kyoto"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Subtitle */}
            <div className="md:col-span-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Subtitle / Descriptive Header</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. An Investigation into Urban Edge Conditions"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413] font-serif text-sm"
              />
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Work Type *</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as CuratedWork['workType'])}
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              >
                <option value="Essay">Essay</option>
                <option value="Photography">Photography</option>
                <option value="Visual Work">Visual Work</option>
                <option value="Mixed Media">Mixed Media</option>
                <option value="Spatial Study">Spatial Study</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Year *</label>
              <input
                type="text"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Date Display */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Display Date *</label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="October 2026"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Visibility Status</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as CuratedWork['visibility'])}
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              >
                <option value="published">Published (Public)</option>
                <option value="draft">Draft (Restricted)</option>
                <option value="hidden">Hidden (Archived)</option>
              </select>
            </div>

            {/* Cover Image URL */}
            <div className="md:col-span-3">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Primary Cover Image URL *</label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  required
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 p-2 bg-white border border-[#E5E3DB] text-[#141413]"
                />
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Preview"
                    className="w-10 h-10 object-cover border border-[#E5E3DB] shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div className="md:col-span-3">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                Lead Excerpt / Curatorial Thesis *
              </label>
              <textarea
                rows={3}
                required
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Opening thesis statement framing the curated visual essay..."
                className="w-full p-2.5 bg-white border border-[#E5E3DB] text-[#141413] font-serif text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Editorial Presentation & Home Layout */}
        <div className="p-6 bg-[#FBFBFA] border border-[#E5E3DB] space-y-6">
          <h3 className="font-serif text-lg text-[#141413] font-medium pb-2 border-b border-[#E5E3DB] flex items-center justify-between">
            <span>2. Home Grid &amp; Curatorial Attributes</span>
            <span className="text-xs font-mono-archival text-[#8C8C82] font-normal">Homepage Layout &amp; Extended Spec</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono-archival">
            {/* Featured on Home */}
            <div className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={featuredOnHome}
                  onChange={(e) => setFeaturedOnHome(e.target.checked)}
                  className="w-4 h-4 text-[#9E2A2B] border-[#E5E3DB]"
                />
                <span className="font-semibold text-[#141413]">Feature on Homepage Grid</span>
              </label>
              <p className="text-[11px] text-[#8C8C82]">
                When enabled, this work appears in the primary Curated Works section on the homepage.
              </p>
            </div>

            {/* Layout Weight */}
            <div className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase font-semibold">
                Homepage Layout Weight
              </label>
              <select
                value={homeLayoutWeight}
                onChange={(e) => setHomeLayoutWeight(e.target.value as CuratedWork['homeLayoutWeight'])}
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              >
                <option value="dominant">Dominant (Large hero showcase)</option>
                <option value="standard">Standard (Balanced editorial tile)</option>
                <option value="editorial-compact">Editorial Compact (Narrow column)</option>
                <option value="horizontal-wide">Horizontal Wide (Span multiple columns)</option>
              </select>
            </div>

            {/* Reading Time */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Estimated Reading Time</label>
              <input
                type="text"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                placeholder="e.g. 12 min read"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Medium */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Medium Specification</label>
              <input
                type="text"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. Pigment prints, 35mm film"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Dimensions / Format</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 120 × 80 cm"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Geographical Field Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kyoto & Kamakura, Japan"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>

            {/* Edition */}
            <div className="md:col-span-2">
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Edition / Folio Spec</label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="e.g. Archival edition of 12 + 2 AP"
                className="w-full p-2 bg-white border border-[#E5E3DB] text-[#141413]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Archival Cross-References & Associations */}
        <div className="p-6 bg-[#FBFBFA] border border-[#E5E3DB] space-y-6">
          <h3 className="font-serif text-lg text-[#141413] font-medium pb-2 border-b border-[#E5E3DB] flex items-center justify-between">
            <span>3. Archival Cross-References &amp; Grounding</span>
            <span className="text-xs font-mono-archival text-[#8C8C82] font-normal">Related Studies &amp; Notebook Entries</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono-archival">
            {/* Related Studies */}
            <div className="space-y-2">
              <span className="block font-semibold text-[#141413] uppercase tracking-wider text-[11px]">
                Grounding Field Studies ({relatedStudyIds.length} selected)
              </span>
              <div className="border border-[#E5E3DB] bg-white max-h-52 overflow-y-auto divide-y divide-[#EFEFEA] p-2">
                {studies.map((s) => {
                  const isChecked = relatedStudyIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="p-2 flex items-start space-x-2.5 hover:bg-[#F4F3EE] cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setRelatedStudyIds(relatedStudyIds.filter((id) => id !== s.id));
                          } else {
                            setRelatedStudyIds([...relatedStudyIds, s.id]);
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-[#141413] block">{s.title}</span>
                        {s.subtitle && <span className="text-[#8C8C82] text-[10px] block">{s.subtitle}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Related Entries */}
            <div className="space-y-2">
              <span className="block font-semibold text-[#141413] uppercase tracking-wider text-[11px]">
                Primary Archival Entries ({relatedEntryIds.length} selected)
              </span>
              <div className="border border-[#E5E3DB] bg-white max-h-52 overflow-y-auto divide-y divide-[#EFEFEA] p-2">
                {entries.map((e) => {
                  const isChecked = relatedEntryIds.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className="p-2 flex items-start space-x-2.5 hover:bg-[#F4F3EE] cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setRelatedEntryIds(relatedEntryIds.filter((id) => id !== e.id));
                          } else {
                            setRelatedEntryIds([...relatedEntryIds, e.id]);
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-[#9E2A2B] font-semibold text-[10px] mr-2">ENTRY {e.entryNumber}</span>
                        <span className="font-medium text-[#141413]">{e.title}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Structured Body Block Authoring */}
        <div className="p-6 bg-[#FBFBFA] border border-[#E5E3DB] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E3DB]">
            <div>
              <h3 className="font-serif text-lg text-[#141413] font-medium">
                4. Structured Body Blocks ({bodyBlocks.length})
              </h3>
              <p className="text-xs font-mono-archival text-[#8C8C82] mt-0.5">
                Author continuous prose, pullquotes, image plates, and diptychs. No raw JSON required.
              </p>
            </div>

            {/* Block Add Controls */}
            <div className="flex flex-wrap gap-1.5 text-xs font-mono-archival">
              <button
                type="button"
                onClick={addProseBlock}
                className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1"
              >
                <AlignLeft className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>+ Prose</span>
              </button>
              <button
                type="button"
                onClick={addPullquoteBlock}
                className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1"
              >
                <Quote className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>+ Pullquote</span>
              </button>
              <button
                type="button"
                onClick={addImageBlock}
                className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>+ Image</span>
              </button>
              <button
                type="button"
                onClick={addTwoColumnImagesBlock}
                className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1"
              >
                <Columns className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>+ Diptych</span>
              </button>
            </div>
          </div>

          {/* Blocks List */}
          <div className="space-y-4">
            {bodyBlocks.map((block, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-[#E5E3DB] space-y-3 transition-colors hover:border-[#141413]"
              >
                {/* Block Header */}
                <div className="flex items-center justify-between text-xs font-mono-archival pb-2 border-b border-[#EFEFEA]">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#8C8C82] font-semibold">BLOCK {index + 1}</span>
                    <span>•</span>
                    <span className="uppercase text-[#9E2A2B] font-semibold tracking-wider">
                      {block.type === 'two_column_images' ? 'DIPTYCH (TWO IMAGES)' : block.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                      className="p-1 text-[#8C8C82] hover:text-[#141413] disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === bodyBlocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                      className="p-1 text-[#8C8C82] hover:text-[#141413] disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="p-1 text-[#8C8C82] hover:text-red-700"
                      title="Remove Block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prose Block Content */}
                {block.type === 'text' && (
                  <div className="space-y-1.5">
                    <label className="block text-[#8C8C82] text-[10px] font-mono-archival uppercase">
                      Prose Section (Continuous text with natural paragraph breaks)
                    </label>
                    <textarea
                      rows={6}
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(index, {
                          type: 'text',
                          content: e.target.value,
                        })
                      }
                      placeholder="Write continuous prose here. Paragraphs and spacing are automatically typeset for the reader..."
                      className="w-full p-3 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] font-serif text-base leading-relaxed focus:outline-hidden focus:border-[#141413]"
                    />
                  </div>
                )}

                {/* Pullquote Block Content */}
                {block.type === 'pullquote' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[#8C8C82] text-[10px] font-mono-archival uppercase mb-1">
                        Quote Content
                      </label>
                      <textarea
                        rows={2}
                        value={block.quote}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            quote: e.target.value,
                          })
                        }
                        placeholder="Quotation text..."
                        className="w-full p-2.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] font-serif italic text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-[#8C8C82] text-[10px] font-mono-archival uppercase mb-1">
                        Attribution / Source Note
                      </label>
                      <input
                        type="text"
                        value={block.attribution || ''}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            attribution: e.target.value,
                          })
                        }
                        placeholder="e.g. Field Notebook Kyoto, 2026"
                        className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                      />
                    </div>
                  </div>
                )}

                {/* Single Image Block Content */}
                {block.type === 'image' && (
                  <div className="space-y-3 text-xs font-mono-archival">
                    <div>
                      <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Image URL</label>
                      <input
                        type="url"
                        value={block.url}
                        onChange={(e) =>
                          updateBlock(index, {
                            ...block,
                            url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Caption</label>
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              caption: e.target.value,
                            })
                          }
                          placeholder="Plate caption..."
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Alt Text</label>
                        <input
                          type="text"
                          value={block.alt || ''}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              alt: e.target.value,
                            })
                          }
                          placeholder="Visual description..."
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                        />
                      </div>
                    </div>
                    {block.url && (
                      <div className="pt-2">
                        <img
                          src={block.url}
                          alt={block.alt || 'Preview'}
                          className="max-h-48 object-cover border border-[#E5E3DB]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Diptych Block Content */}
                {block.type === 'two_column_images' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-archival">
                    {/* Column 1 */}
                    <div className="p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
                      <span className="font-semibold text-[#141413] block">LEFT IMAGE</span>
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Image URL</label>
                        <input
                          type="url"
                          value={block.url1}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              url1: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full p-2 bg-white border border-[#E5E3DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Caption</label>
                        <input
                          type="text"
                          value={block.caption1 || ''}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              caption1: e.target.value,
                            })
                          }
                          placeholder="Left caption..."
                          className="w-full p-2 bg-white border border-[#E5E3DB]"
                        />
                      </div>
                      {block.url1 && (
                        <img
                          src={block.url1}
                          alt="Left Preview"
                          className="h-28 w-full object-cover border border-[#E5E3DB]"
                        />
                      )}
                    </div>

                    {/* Column 2 */}
                    <div className="p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
                      <span className="font-semibold text-[#141413] block">RIGHT IMAGE</span>
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Image URL</label>
                        <input
                          type="url"
                          value={block.url2}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              url2: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full p-2 bg-white border border-[#E5E3DB]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Caption</label>
                        <input
                          type="text"
                          value={block.caption2 || ''}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              caption2: e.target.value,
                            })
                          }
                          placeholder="Right caption..."
                          className="w-full p-2 bg-white border border-[#E5E3DB]"
                        />
                      </div>
                      {block.url2 && (
                        <img
                          src={block.url2}
                          alt="Right Preview"
                          className="h-28 w-full object-cover border border-[#E5E3DB]"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Bottom Action Bar */}
        <div className="pt-6 border-t border-[#E5E3DB] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowReaderPreview(true)}
              className="px-4 py-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#141413] hover:border-[#141413] flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#9E2A2B]" />
              <span>Preview as Reader</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66] hover:text-[#141413]"
            >
              Cancel
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-[#9E2A2B] text-[#FBFBFA] hover:bg-[#801C1D] text-xs font-mono-archival tracking-wider uppercase font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving to D1...' : isEditing ? 'Save Changes' : 'Publish Curated Work'}</span>
          </button>
        </div>
      </form>

      {/* Reader Preview Modal */}
      {showReaderPreview && (
        <CuratedWorkReaderPreview
          work={currentWorkObject}
          relatedStudies={previewRelatedStudies}
          relatedEntries={previewRelatedEntries}
          onClose={() => setShowReaderPreview(false)}
        />
      )}
    </div>
  );
};
