import React, { useState, useMemo } from 'react';
import { ArrowRight, ArrowLeft, FolderKanban, Tag, Layers, Database, CornerDownRight } from 'lucide-react';
import { AppView, Thread, INITIAL_ENTRY_MEDIUMS } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface LaboratoryViewProps {
  onNavigate: (view: AppView) => void;
  filterThreadId?: string;
}

const MEDIUM_METADATA: Record<string, { description: string; tag: string }> = {
  'Creative Writing': {
    description: 'Textual prose, speculative narratives, lyrical fragments, and literary inquiry.',
    tag: 'TEXT & PROSE',
  },
  'Clothing / Upcycling': {
    description: 'Textile construction, pattern deconstruction, material reuse, and garment studies.',
    tag: 'TEXTILE & FORM',
  },
  'Visual Work': {
    description: 'Photographic documentation, typographic surveys, architectural rubbings, and visual artifacts.',
    tag: 'VISUAL & PLASTIC',
  },
  'Research / Inquiry': {
    description: 'Methodological frameworks, archival indexing, critical bibliography, and epistemic notes.',
    tag: 'EPISTEMIC & THEORY',
  },
};

export const LaboratoryView: React.FC<LaboratoryViewProps> = ({ onNavigate, filterThreadId }) => {
  const {
    collections,
    studies,
    entries,
    threads,
    getCollection,
    getStudy,
    getThread,
    getStudiesByCollection,
    getEntriesByStudy,
  } = useArchive();

  const [selectedThread, setSelectedThread] = useState<string | null>(filterThreadId || null);
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);

  // All published entries
  const allPublishedEntries = useMemo(
    () => entries.filter((e) => e.visibility === 'published'),
    [entries]
  );

  // Derive active mediums strictly from published entries (no empty categories publicly)
  const availableMediums = useMemo(() => {
    const counts: Record<string, number> = {};
    allPublishedEntries.forEach((entry) => {
      if (entry.medium && entry.medium.trim()) {
        counts[entry.medium] = (counts[entry.medium] || 0) + 1;
      }
    });

    const mediums = Object.keys(counts).filter((m) => counts[m] > 0);

    return mediums
      .sort((a, b) => {
        const idxA = INITIAL_ENTRY_MEDIUMS.indexOf(a as any);
        const idxB = INITIAL_ENTRY_MEDIUMS.indexOf(b as any);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((name) => {
        const meta = MEDIUM_METADATA[name] || {
          description: `Archival entries cataloged under the ${name} discipline.`,
          tag: 'MEDIUM',
        };
        const sampleEntries = allPublishedEntries
          .filter((e) => e.medium === name)
          .sort(
            (a, b) =>
              new Date(b.createdDate.replace(/\./g, '-')).getTime() -
              new Date(a.createdDate.replace(/\./g, '-')).getTime()
          )
          .slice(0, 3);

        return {
          name,
          count: counts[name],
          description: meta.description,
          tag: meta.tag,
          sampleEntries,
        };
      });
  }, [allPublishedEntries]);

  // Entries within currently selected medium, respect thread filter
  const mediumEntries = useMemo(() => {
    if (!selectedMedium) return [];
    return allPublishedEntries
      .filter((e) => e.medium === selectedMedium)
      .filter((e) => (selectedThread ? e.threadIds.includes(selectedThread) : true))
      .sort(
        (a, b) =>
          new Date(b.createdDate.replace(/\./g, '-')).getTime() -
          new Date(a.createdDate.replace(/\./g, '-')).getTime()
      );
  }, [allPublishedEntries, selectedMedium, selectedThread]);

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

        {/* Horizontal Thread Filter Ribbon */}
        <div className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
            <span className="flex items-center space-x-1.5 font-medium text-[#141413]">
              <Tag className="w-3 h-3 text-[#9E2A2B]" />
              <span>CONCEPTUAL THREADS</span>
            </span>
            {selectedThread && (
              <button
                onClick={() => setSelectedThread(null)}
                className="text-[11px] text-[#9E2A2B] hover:underline"
              >
                Clear Thread Filter &times;
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setSelectedThread(null)}
              className={`text-xs font-mono-archival px-2.5 py-1 border transition-colors ${
                selectedThread === null
                  ? 'bg-[#141413] text-[#FBFBFA] border-[#141413]'
                  : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
              }`}
            >
              All Threads ({allPublishedEntries.length})
            </button>
            {threads.map((thread) => {
              const count = allPublishedEntries.filter((e) =>
                e.threadIds.includes(thread.id)
              ).length;
              const isSelected = selectedThread === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(isSelected ? null : thread.id)}
                  className={`text-xs font-mono-archival px-2.5 py-1 border transition-colors flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#9E2A2B] text-[#FBFBFA] border-[#9E2A2B] font-medium'
                      : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#9E2A2B] hover:text-[#9E2A2B]'
                  }`}
                >
                  <span>{thread.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-[#FBFBFA]/80' : 'text-[#8C8C82]'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableMediums.map((med) => (
                      <div
                        key={med.name}
                        onClick={() => setSelectedMedium(med.name)}
                        className="group p-5 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#EAE8E0] text-[#141413] font-medium">
                              {med.tag}
                            </span>
                            <span className="text-[#9E2A2B] font-semibold">
                              {med.count} {med.count === 1 ? 'RECORD' : 'RECORDS'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-serif text-xl text-[#141413] group-hover:text-[#9E2A2B] font-medium transition-colors">
                              {med.name}
                            </h3>
                            <p className="font-serif text-xs text-[#5C5C54] mt-1.5 leading-relaxed">
                              {med.description}
                            </p>
                          </div>

                          {/* Sample entries preview */}
                          {med.sampleEntries.length > 0 && (
                            <div className="pt-3 border-t border-[#EFEFEA] space-y-1.5">
                              <span className="text-[10px] font-mono-archival text-[#8C8C82] uppercase tracking-wider block">
                                Recent Entries
                              </span>
                              <ul className="space-y-1">
                                {med.sampleEntries.map((sample) => (
                                  <li
                                    key={sample.id}
                                    className="text-xs font-serif truncate flex items-center space-x-1.5 text-[#5C5C54]"
                                  >
                                    <span className="text-[#8C8C82] font-mono-archival text-[10px] shrink-0">
                                      {sample.entryNumber}
                                    </span>
                                    <span className="truncate group-hover:text-[#141413] transition-colors">
                                      {sample.title}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 flex items-center justify-between text-xs font-mono-archival text-[#141413] font-medium group-hover:text-[#9E2A2B] transition-colors border-t border-[#EFEFEA] mt-4">
                          <span>Browse Medium Entries</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
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
                      {mediumEntries.length} {mediumEntries.length === 1 ? 'RECORD' : 'RECORDS'}{' '}
                      {selectedThread ? '(FILTERED)' : ''}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-[#E5E3DB]">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-wider uppercase mb-1">
                        <span className="text-[#9E2A2B] font-semibold">MEDIUM CLASSIFICATION</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium">
                        {selectedMedium}
                      </h2>
                      {MEDIUM_METADATA[selectedMedium]?.description && (
                        <p className="font-serif text-xs text-[#5C5C54] mt-1 italic">
                          {MEDIUM_METADATA[selectedMedium].description}
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

                {/* List of Entries in this medium */}
                <div className="divide-y divide-[#E5E3DB] border-y border-[#E5E3DB]">
                  {mediumEntries.length === 0 ? (
                    <div className="py-12 text-center text-sm font-mono-archival text-[#8C8C82]">
                      No entries found for this medium matching current thread filter.
                    </div>
                  ) : (
                    mediumEntries.map((entry) => {
                      const collection = getCollection(entry.collectionId);
                      const study = getStudy(entry.studyId);

                      return (
                        <article
                          key={entry.id}
                          onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                          className="group py-5 px-3 -mx-3 hover:bg-[#F4F3EE]/80 cursor-pointer transition-colors space-y-2.5"
                        >
                          {/* Entry Header: Date + ID + Revision + Location */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-semibold text-[#141413]">
                                {entry.createdDate}
                              </span>
                              <span>•</span>
                              <span className="text-[#141413]">
                                ENTRY {entry.entryNumber}
                              </span>
                              <span className="px-1 py-0.2 bg-[#EAE8E0] text-[#9E2A2B] text-[10px] font-medium">
                                {entry.ruiRevision}
                              </span>
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
              {collections.map((collection) => {
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
                      <span>{collection.period}</span>
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
