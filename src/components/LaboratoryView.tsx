import React, { useState } from 'react';
import { ArrowRight, FolderKanban, Tag, Filter, Database, Calendar, CornerDownRight } from 'lucide-react';
import { AppView, Thread } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface LaboratoryViewProps {
  onNavigate: (view: AppView) => void;
  filterThreadId?: string;
}

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

  const publishedEntries = entries
    .filter((e) => e.visibility === 'published')
    .filter((e) => (selectedThread ? e.threadIds.includes(selectedThread) : true))
    .sort((a, b) => new Date(b.createdDate.replace(/\./g, '-')).getTime() - new Date(a.createdDate.replace(/\./g, '-')).getTime());

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
              All Threads ({entries.filter((e) => e.visibility === 'published').length})
            </button>
            {threads.map((thread) => {
              const count = entries.filter(
                (e) => e.visibility === 'published' && e.threadIds.includes(thread.id)
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

        {/* Dual Structure Layout: Chronological Entries (Dominant) + Collections (Contextual) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Area: Chronological Entry Index (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DB]">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#8C8C82]" />
                <h2 className="font-serif text-xl sm:text-2xl text-[#141413] font-medium">
                  Chronological Entry Sequence
                </h2>
              </div>
              <span className="text-xs font-mono-archival text-[#8C8C82]">
                {publishedEntries.length} RECORDS {selectedThread ? `(FILTERED)` : ''}
              </span>
            </div>

            {/* List of Entries */}
            <div className="divide-y divide-[#E5E3DB] border-y border-[#E5E3DB]">
              {publishedEntries.length === 0 ? (
                <div className="py-12 text-center text-sm font-mono-archival text-[#8C8C82]">
                  No entries found matching current filter.
                </div>
              ) : (
                publishedEntries.map((entry) => {
                  const collection = getCollection(entry.collectionId);
                  const study = getStudy(entry.studyId);

                  return (
                    <article
                      key={entry.id}
                      onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                      className="group py-5 px-3 -mx-3 hover:bg-[#F4F3EE]/80 cursor-pointer transition-colors space-y-2.5"
                    >
                      {/* Entry Header: Date + ID + Revision */}
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
