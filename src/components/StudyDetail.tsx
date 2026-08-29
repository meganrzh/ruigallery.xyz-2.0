import React from 'react';
import { ArrowLeft, Compass, Tag, Calendar, Layers } from 'lucide-react';
import { AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface StudyDetailProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

export const StudyDetail: React.FC<StudyDetailProps> = ({ slug, onNavigate }) => {
  const { getStudy, getCollection, getEntriesByStudy, getThread } = useArchive();
  const study = getStudy(slug);

  if (!study) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-[#141413]">Study not found</h2>
        <button
          onClick={() => onNavigate({ page: 'laboratory' })}
          className="mt-4 text-xs font-mono-archival text-[#9E2A2B] underline"
        >
          Return to Laboratory
        </button>
      </div>
    );
  }

  const collection = getCollection(study.collectionId);
  const entries = getEntriesByStudy(study.id);
  const studyThreads = study.threadIds.map((tId) => getThread(tId)).filter(Boolean);

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#6E6E66]">
          <button
            onClick={() => onNavigate({ page: 'laboratory' })}
            className="hover:text-[#141413] flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Laboratory</span>
          </button>
          <span>/</span>
          {collection && (
            <button
              onClick={() => onNavigate({ page: 'collection', slug: collection.slug })}
              className="hover:text-[#141413] underline"
            >
              {collection.title}
            </button>
          )}
        </div>

        {/* Study Header */}
        <header className="space-y-4 pb-8 border-b border-[#E5E3DB]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
            <div className="flex items-center space-x-2">
              <span className="text-[#9E2A2B] font-semibold uppercase">STUDY</span>
              <span>•</span>
              <span>ORDER #{study.order}</span>
              {collection && (
                <>
                  <span>•</span>
                  <span>COL: {collection.title}</span>
                </>
              )}
            </div>
            <span>INITIATED: {study.createdDate}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium leading-tight">
            {study.title}
          </h1>

          {study.subtitle && (
            <p className="font-serif text-lg sm:text-xl text-[#5C5C54] italic">
              {study.subtitle}
            </p>
          )}

          {/* Threads & Metadata */}
          <div className="pt-4 border-t border-[#EFEFEA] flex flex-wrap items-center justify-between gap-4 text-xs font-mono-archival text-[#6E6E66]">
            <div className="flex items-center space-x-2">
              <span className="text-[#8C8C82]">THREADS:</span>
              <div className="flex flex-wrap gap-1">
                {studyThreads.map((t) => (
                  <button
                    key={t!.id}
                    onClick={() => onNavigate({ page: 'archive', initialThread: t!.id })}
                    className="px-2 py-0.5 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#9E2A2B] text-[#141413] hover:text-[#9E2A2B]"
                  >
                    #{t!.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[#8C8C82]">TOTAL ENTRIES: </span>
              <span className="text-[#141413] font-semibold">{entries.length}</span>
            </div>
          </div>
        </header>

        {/* Study Inquiry Narrative */}
        <div className="font-serif text-lg sm:text-xl text-[#2C2C28] leading-relaxed max-w-prose">
          {study.description}
        </div>

        {/* Entries in Sequence */}
        <section className="space-y-6 pt-8 border-t border-[#E5E3DB]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#141413] font-medium">
              Entries in Sequence ({entries.length})
            </h2>
            <span className="text-xs font-mono-archival text-[#8C8C82]">
              REVERSE CHRONOLOGY
            </span>
          </div>

          <div className="space-y-4">
            {entries.map((entry) => (
              <article
                key={entry.id}
                onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                className="p-5 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#141413]">{entry.createdDate}</span>
                    <span>•</span>
                    <span className="text-[#141413]">ENTRY {entry.entryNumber}</span>
                    <span className="px-1.5 py-0.2 bg-[#EAE8E0] text-[#9E2A2B] font-medium text-[10px]">
                      {entry.ruiRevision}
                    </span>
                  </div>
                  {entry.location && <span>{entry.location}</span>}
                </div>

                <h3 className="font-serif text-xl sm:text-2xl text-[#141413] group-hover:text-[#9E2A2B] font-medium transition-colors leading-snug">
                  {entry.title}
                </h3>

                {entry.summary && (
                  <p className="font-serif text-sm text-[#4A4A44] leading-relaxed line-clamp-2">
                    {entry.summary}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between text-xs font-mono-archival">
                  <div className="flex gap-1">
                    {entry.threadIds.map((tId) => {
                      const t = getThread(tId);
                      return t ? (
                        <span key={t.id} className="text-[10px] text-[#8C8C82]">
                          #{t.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <span className="text-[#141413] group-hover:underline">
                    Read Notebook Entry &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
