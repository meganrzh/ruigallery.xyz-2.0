import React, { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, FolderKanban, Layers, Database, CornerDownRight } from 'lucide-react';
import { AppView, INITIAL_ENTRY_MEDIUMS } from '../types';
import { useArchive } from '../context/ArchiveContext';
import { formatFullDate, compareDatesDesc } from '../utils/dateFormatting';
import { isImageLedMedium, getEntryPreviewImage, getMediumDefinition, CANONICAL_MEDIUMS } from '../utils/mediumHelpers';

interface LaboratoryViewProps {
  onNavigate: (view: AppView) => void;
  filterThreadId?: string;
}

export const LaboratoryView: React.FC<LaboratoryViewProps> = ({ onNavigate }) => {
  const {
    collections,
    studies,
    entries,
    getCollection,
    getStudy,
    getThread,
    getStudiesByCollection,
    getEntriesByStudy,
  } = useArchive();

  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);

  // All published entries
  const allPublishedEntries = useMemo(
    () => entries.filter((e) => e.visibility === 'published'),
    [entries]
  );

  // Collections showcase order: sorted explicitly by Admin-defined display order
  const showcaseCollections = useMemo(() => {
    return [...collections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [collections]);

  // Derive medium cards from canonical taxonomy so all 6 canonical mediums exist
  // as part of RUI's architecture, plus any custom mediums with published entries
  const availableMediums = useMemo(() => {
    const counts: Record<string, number> = {};
    allPublishedEntries.forEach((entry) => {
      if (entry.medium && entry.medium.trim()) {
        const m = entry.medium.trim();
        counts[m] = (counts[m] || 0) + 1;
      }
    });

    const canonicalNames = Object.keys(CANONICAL_MEDIUMS);
    const customNames = Object.keys(counts).filter(
      (m) => counts[m] > 0 && !canonicalNames.includes(m)
    );

    const allNames = [...canonicalNames, ...customNames];

    return allNames.map((name) => {
      const meta = getMediumDefinition(name);
      const latestWorks = allPublishedEntries
        .filter((e) => e.medium?.trim() === name)
        .sort((a, b) => compareDatesDesc(a.createdDate, b.createdDate))
        .slice(0, 3);

      return {
        name,
        count: counts[name] || 0,
        description: meta.description,
        tag: meta.tag,
        latestWorks,
      };
    });
  }, [allPublishedEntries]);

  // Entries within currently selected medium
  const mediumEntries = useMemo(() => {
    if (!selectedMedium) return [];
    return allPublishedEntries
      .filter((e) => e.medium === selectedMedium)
      .sort((a, b) => compareDatesDesc(a.createdDate, b.createdDate));
  }, [allPublishedEntries, selectedMedium]);

  // Collections scoped specifically to currently selected medium
  const mediumScopedCollections = useMemo(() => {
    if (!selectedMedium) return [];
    return collections
      .filter((c) => c.mediumScope === selectedMedium)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [collections, selectedMedium]);

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Register */}
        <div className="pb-8 border-b border-[#E5E3DB] flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-wider uppercase mb-1">
              <span>Section 02</span>
              <span>•</span>
              <span className="text-[#9E2A2B] font-medium">RESEARCH REPOSITORY</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium">
              The Laboratory
            </h1>
            <p className="font-serif text-base text-[#5C5C54] mt-2 max-w-2xl leading-relaxed">
              An archival workspace for ongoing inquiries, notebook fragments, field surveys, and evolving studies. Chronologically anchored and organized by conceptual collections.
            </p>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <button
              onClick={() => onNavigate({ page: 'archive' })}
              className="inline-flex items-center space-x-2 text-xs font-mono-archival py-2 px-3.5 border border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-[#FBFBFA] transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Full Database View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dual Structure Layout: Mediums (Dominant) + Collections (Contextual) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Area: Mediums Section (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedMedium === null ? (
              /* DEFAULT VIEW: Showcase the Medium Categories */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB]">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#8C8C82]" />
                    <h2 className="font-serif text-xl sm:text-2xl text-[#141413] font-medium">
                      Mediums
                    </h2>
                  </div>
                  <span className="text-xs font-mono-archival text-[#8C8C82]">
                    {availableMediums.length} ACTIVE CATEGORIES
                  </span>
                </div>

                <p className="font-serif text-xs sm:text-sm text-[#5C5C54] leading-relaxed -mt-2">
                  Browse laboratory records classified by creative medium and material discipline. Select a medium to reveal its cataloged entries.
                </p>

                {availableMediums.length === 0 ? (
                  <div className="py-12 text-center text-sm font-mono-archival text-[#8C8C82] border border-[#E5E3DB] bg-[#FBFBFA]">
                    No published mediums currently available.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {availableMediums.map((med) => {
                      const isImageLed = isImageLedMedium(med.name);

                      return (
                        <div
                          key={med.name}
                          className="group p-6 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            {/* Card Category Header */}
                            <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#EAE8E0] text-[#141413] font-medium">
                                {med.tag}
                              </span>
                              <span className="text-[#9E2A2B] font-semibold">
                                {med.count} {med.count === 1 ? 'RECORD' : 'RECORDS'}
                              </span>
                            </div>

                            {/* Card Title & Description */}
                            <div>
                              <h3
                                onClick={() => setSelectedMedium(med.name)}
                                className="font-serif text-2xl text-[#141413] group-hover:text-[#9E2A2B] font-medium transition-colors cursor-pointer inline-block"
                              >
                                {med.name}
                              </h3>
                              <p className="font-serif text-xs text-[#5C5C54] mt-1.5 leading-relaxed">
                                {med.description}
                              </p>
                            </div>

                            {/* Latest works section */}
                            <div className="pt-4 border-t border-[#EFEFEA] space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono-archival text-[#8C8C82] uppercase tracking-wider block font-medium">
                                  Latest Works
                                </span>
                              </div>

                              {med.latestWorks.length === 0 ? (
                                <p className="text-xs font-serif italic text-[#8C8C82] py-0.5">
                                  No published records in this medium.
                                </p>
                              ) : isImageLed ? (
                                /* Compact Image-Led Previews for Visual Work & Clothing / Upcycling */
                                <div className="grid grid-cols-3 gap-2.5 pt-1 items-start">
                                  {med.latestWorks.map((work) => {
                                    const previewImg = getEntryPreviewImage(work);

                                    return (
                                      <div
                                        key={work.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNavigate({ page: 'entry', slug: work.slug });
                                        }}
                                        className="group/work cursor-pointer text-left flex flex-col"
                                        title={`View ${work.title}`}
                                      >
                                        {/* Compact Uncropped Plate */}
                                        <div className="w-full h-20 bg-[#F4F3EE] border border-[#E5E3DB] group-hover/work:border-[#141413] flex items-center justify-center p-1 overflow-hidden transition-colors">
                                          {previewImg ? (
                                            <img
                                              src={previewImg.url}
                                              alt={previewImg.alt || work.title}
                                              className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover/work:scale-[1.03]"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <span className="text-[8px] font-mono-archival text-[#8C8C82] text-center px-1 uppercase">
                                              Text
                                            </span>
                                          )}
                                        </div>

                                        {/* Archival Identification: Accession Number + Title (mirrors text mediums) */}
                                        <div className="pt-1.5 space-y-0.5 min-w-0">
                                          <span className="text-[#8C8C82] group-hover/work:text-[#9E2A2B] font-mono-archival text-[10px] font-medium block">
                                            {work.entryNumber}
                                          </span>
                                          <h4 className="font-serif text-[11px] text-[#141413] group-hover/work:text-[#9E2A2B] font-medium leading-snug line-clamp-2 transition-colors">
                                            {work.title}
                                          </h4>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Text-Oriented Mediums (Creative Writing, Analytical Essay, Research / Inquiry, Curated Event) */
                                <ul className="space-y-1.5">
                                  {med.latestWorks.map((work) => (
                                    <li
                                      key={work.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate({ page: 'entry', slug: work.slug });
                                      }}
                                      className="text-xs font-serif truncate flex items-center space-x-1.5 text-[#5C5C54] hover:text-[#141413] cursor-pointer group/item py-0.5"
                                      title={`View ${work.title}`}
                                    >
                                      <span className="text-[#8C8C82] group-hover/item:text-[#9E2A2B] font-mono-archival text-[10px] shrink-0 font-medium">
                                        {work.entryNumber}
                                      </span>
                                      <span className="truncate group-hover/item:text-[#141413] transition-colors">
                                        {work.title}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div
                            onClick={() => setSelectedMedium(med.name)}
                            className="pt-4 flex items-center justify-between text-xs font-mono-archival text-[#141413] font-medium group-hover:text-[#9E2A2B] transition-colors border-t border-[#EFEFEA] mt-5 cursor-pointer"
                          >
                            <span>Browse All {med.name} Records ({med.count})</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* SELECTED MEDIUM VIEW: Reveal & browse Entries within the selected medium */
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedMedium(null)}
                      className="group inline-flex items-center space-x-1.5 text-xs font-mono-archival text-[#6E6E66] hover:text-[#141413] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span>All Mediums</span>
                    </button>

                    <span className="text-xs font-mono-archival text-[#8C8C82]">
                      {mediumEntries.length} {mediumEntries.length === 1 ? 'RECORD' : 'RECORDS'}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-[#E5E3DB]">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-wider uppercase mb-1">
                        <span className="text-[#9E2A2B] font-semibold">{getMediumDefinition(selectedMedium).tag}</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium">
                        {selectedMedium}
                      </h2>
                      {getMediumDefinition(selectedMedium).description && (
                        <p className="font-serif text-xs text-[#5C5C54] mt-1 italic">
                          {getMediumDefinition(selectedMedium).description}
                        </p>
                      )}
                    </div>

                    {/* Quick switcher tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-[#EFEFEA]">
                      <button
                        onClick={() => setSelectedMedium(null)}
                        className="text-[11px] font-mono-archival px-2 py-0.5 border border-[#E5E3DB] bg-[#FBFBFA] text-[#6E6E66] hover:border-[#141413] hover:text-[#141413] transition-colors"
                      >
                        All Mediums
                      </button>
                      {availableMediums.map((m) => {
                        const isCurrent = m.name === selectedMedium;
                        return (
                          <button
                            key={m.name}
                            onClick={() => setSelectedMedium(m.name)}
                            className={`text-[11px] font-mono-archival px-2 py-0.5 border transition-colors flex items-center space-x-1 ${
                              isCurrent
                                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
                            }`}
                          >
                            <span>{m.name}</span>
                            <span className={`text-[10px] ${isCurrent ? 'text-[#FBFBFA]/80' : 'text-[#8C8C82]'}`}>
                              ({m.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Medium-Scoped Collections (Series) - Collapsed entirely if none exist */}
                {mediumScopedCollections.length > 0 && (
                  <div className="space-y-3 pb-6 border-b border-[#E5E3DB]">
                    <span className="text-[10px] font-mono-archival text-[#8C8C82] uppercase tracking-wider block font-medium">
                      Series
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {mediumScopedCollections.map((col) => {
                        const publishedWorksCount = allPublishedEntries.filter(
                          (e) => e.collectionId === col.id
                        ).length;

                        return (
                          <div
                            key={col.id}
                            onClick={() => onNavigate({ page: 'collection', slug: col.slug })}
                            className="group p-3.5 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] transition-colors cursor-pointer text-left flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <h4 className="font-serif text-sm font-medium text-[#141413] group-hover:text-[#9E2A2B] transition-colors leading-snug">
                                {col.title}
                              </h4>
                              {col.subtitle && (
                                <p className="font-serif text-xs text-[#5C5C54] italic line-clamp-2 leading-relaxed">
                                  {col.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 mt-2 border-t border-[#EFEFEA] text-[11px] font-mono-archival text-[#8C8C82]">
                              <span>
                                {publishedWorksCount} {publishedWorksCount === 1 ? 'work' : 'works'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* List of Entries in this medium */}
                <div className="divide-y divide-[#E5E3DB] border-y border-[#E5E3DB]">
                  {mediumEntries.length === 0 ? (
                    <div className="py-12 text-center text-sm font-mono-archival text-[#8C8C82]">
                      No entries found for this medium.
                    </div>
                  ) : (
                    mediumEntries.map((entry) => {
                      const collection = getCollection(entry.collectionId);
                      const study = getStudy(entry.studyId);
                      const previewImg = isImageLedMedium(selectedMedium)
                        ? getEntryPreviewImage(entry)
                        : null;

                      return (
                        <article
                          key={entry.id}
                          onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                          className="group py-5 px-3 -mx-3 hover:bg-[#F4F3EE]/80 cursor-pointer transition-colors flex flex-col sm:flex-row gap-5 items-start justify-between"
                        >
                          <div className="space-y-2.5 flex-1 min-w-0">
                            {/* Entry Header: Date + ID + Revision + Location */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
                              <div className="flex items-center space-x-2.5">
                                <span className="font-semibold text-[#141413]">
                                  {formatFullDate(entry.createdDate)}
                                </span>
                                <span>•</span>
                                <span className="text-[#141413]">
                                  ENTRY {entry.entryNumber}
                                </span>
                                {entry.ruiRevision && (
                                  <span className="px-1 py-0.2 bg-[#EAE8E0] text-[#9E2A2B] text-[10px] font-medium">
                                    {entry.ruiRevision}
                                  </span>
                                )}
                              </div>
                              {entry.location && (
                                <span className="text-[11px] text-[#8C8C82]">
                                  {entry.location}
                                </span>
                              )}
                            </div>

                            {/* Entry Title */}
                            <h3 className="font-serif text-xl sm:text-2xl text-[#141413] group-hover:text-[#9E2A2B] transition-colors leading-snug font-medium">
                              {entry.title}
                            </h3>

                            {/* Contextual Hierarchy: Study & Collection */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono-archival text-[#6E6E66]">
                              {study && (
                                <span className="flex items-center space-x-1">
                                  <span className="text-[#8C8C82]">Study:</span>
                                  <span className="text-[#141413]">{study.title}</span>
                                </span>
                              )}
                              {collection && (
                                <span className="flex items-center space-x-1">
                                  <span className="text-[#8C8C82]">Col:</span>
                                  <span>{collection.title}</span>
                                </span>
                              )}
                            </div>

                            {/* Summary if present */}
                            {entry.summary && (
                              <p className="font-serif text-sm text-[#4A4A44] leading-relaxed line-clamp-2 pt-1">
                                {entry.summary}
                              </p>
                            )}

                            {/* Associated Threads */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {entry.threadIds.map((tId) => {
                                const t = getThread(tId);
                                if (!t) return null;
                                return (
                                  <span
                                    key={t.id}
                                    className="text-[10px] font-mono-archival px-1.5 py-0.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#6E6E66]"
                                  >
                                    #{t.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Visual plate for Image-Led Medium entries */}
                          {previewImg && (
                            <div className="w-full sm:w-40 md:w-48 h-36 shrink-0 bg-[#F4F3EE] border border-[#E5E3DB] p-2 flex items-center justify-center overflow-hidden">
                              <img
                                src={previewImg.url}
                                alt={previewImg.alt || entry.title}
                                className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Secondary Area: Collections (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="pb-3 border-b border-[#E5E3DB] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-[#8C8C82]" />
                <h2 className="font-serif text-xl text-[#141413] font-medium">
                  Collections
                </h2>
              </div>
              <span className="text-xs font-mono-archival text-[#8C8C82]">
                {collections.length} BODIES
              </span>
            </div>

            <div className="space-y-4">
              {showcaseCollections.map((collection) => {
                const studiesInCol = getStudiesByCollection(collection.id);
                const totalEntries = entries.filter(
                  (e) => e.collectionId === collection.id && e.visibility === 'published'
                ).length;

                return (
                  <div
                    key={collection.id}
                    className="p-5 bg-[#F4F3EE] border border-[#E5E3DB] space-y-3 hover:border-[#141413] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                      <div className="flex items-center space-x-1.5">
                        <span>{collection.period}</span>
                        {collection.mediumScope && (
                          <>
                            <span>•</span>
                            <span className="text-[#9E2A2B] font-medium uppercase text-[10px]">{collection.mediumScope}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[#141413] font-medium">{totalEntries} ENTRIES</span>
                    </div>

                    <h3
                      onClick={() => onNavigate({ page: 'collection', slug: collection.slug })}
                      className="font-serif text-xl text-[#141413] hover:text-[#9E2A2B] cursor-pointer font-medium leading-snug"
                    >
                      {collection.title}
                    </h3>

                    {collection.subtitle && (
                      <p className="font-serif text-xs text-[#6E6E66] italic">
                        {collection.subtitle}
                      </p>
                    )}

                    <p className="font-serif text-xs text-[#4A4A44] leading-relaxed line-clamp-3">
                      {collection.description}
                    </p>

                    {/* Nested Studies list */}
                    <div className="pt-3 border-t border-[#E5E3DB] space-y-2">
                      <span className="text-[10px] font-mono-archival text-[#8C8C82] uppercase">
                        Associated Studies ({studiesInCol.length})
                      </span>
                      <ul className="space-y-1.5">
                        {studiesInCol.map((study) => {
                          const studyEntryCount = getEntriesByStudy(study.id).length;
                          return (
                            <li key={study.id}>
                              <button
                                onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                                className="group w-full text-left flex items-center justify-between text-xs font-serif text-[#141413] hover:text-[#9E2A2B]"
                              >
                                <span className="truncate pr-2 group-hover:underline">
                                  &rarr; {study.title}
                                </span>
                                <span className="font-mono-archival text-[10px] text-[#8C8C82] shrink-0">
                                  {studyEntryCount}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => onNavigate({ page: 'collection', slug: collection.slug })}
                        className="inline-flex items-center space-x-1 text-xs font-mono-archival text-[#141413] hover:text-[#9E2A2B] font-medium"
                      >
                        <span>View Collection Page</span>
                        <CornerDownRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
