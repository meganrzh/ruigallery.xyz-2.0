import React from 'react';
import { ArrowLeft, ArrowRight, Compass, Calendar, MapPin, Tag } from 'lucide-react';
import { AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';
import { EntryMetadataHeader } from './EntryMetadataHeader';
import { EntryBodyRenderer } from './EntryBodyRenderer';

interface EntryDetailProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

export const EntryDetail: React.FC<EntryDetailProps> = ({ slug, onNavigate }) => {
  const {
    getEntry,
    getCollection,
    getStudy,
    getThread,
    getRelatedStudiesForEntry,
    getNextPrevEntry,
  } = useArchive();

  const entry = getEntry(slug);

  if (!entry) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-[#141413]">Entry not found</h2>
        <button
          onClick={() => onNavigate({ page: 'laboratory' })}
          className="mt-4 text-xs font-mono-archival text-[#9E2A2B] underline"
        >
          Return to Laboratory
        </button>
      </div>
    );
  }

  const collection = getCollection(entry.collectionId);
  const study = getStudy(entry.studyId);
  const threads = entry.threadIds.map((tId) => getThread(tId)).filter(Boolean) as any[];
  const relatedStudies = getRelatedStudiesForEntry(entry);
  const { prev, next } = getNextPrevEntry(entry.id);

  return (
    <article className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#6E6E66]">
          <button
            onClick={() => onNavigate({ page: 'laboratory' })}
            className="hover:text-[#141413] flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Laboratory</span>
          </button>
          {collection && (
            <>
              <span>/</span>
              <button
                onClick={() => onNavigate({ page: 'collection', slug: collection.slug })}
                className="hover:text-[#141413] truncate max-w-[140px] sm:max-w-none"
              >
                {collection.title}
              </button>
            </>
          )}
          {study && (
            <>
              <span>/</span>
              <button
                onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                className="hover:text-[#141413] truncate max-w-[140px] sm:max-w-none underline decoration-dotted"
              >
                {study.title}
              </button>
            </>
          )}
        </div>

        {/* Rigid Archival Metadata Framework Header */}
        <EntryMetadataHeader
          entry={entry}
          collection={collection}
          study={study}
          threads={threads}
          onNavigate={onNavigate}
        />

        {/* Entry Title & Inquiry Heading */}
        <header className="space-y-3 pt-4 pb-6 border-b border-[#E5E3DB]">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium leading-[1.15]">
            {entry.title}
          </h1>
          {entry.summary && (
            <p className="font-serif text-base sm:text-lg text-[#5C5C54] italic leading-relaxed">
              {entry.summary}
            </p>
          )}
        </header>

        {/* Flexible Notebook Content Body */}
        <EntryBodyRenderer blocks={entry.blocks} />

        {/* Related Studies Cross-References (Near End of Entry) */}
        {relatedStudies.length > 0 && (
          <section className="mt-14 pt-8 border-t border-[#E5E3DB] bg-[#F4F3EE] p-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#9E2A2B] uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Related Studies in Laboratory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedStudies.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onNavigate({ page: 'study', slug: s.slug })}
                  className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-mono-archival text-[#8C8C82] block">
                    STUDY #{s.order}
                  </span>
                  <h4 className="font-serif text-sm text-[#141413] font-medium hover:text-[#9E2A2B]">
                    {s.title} &rarr;
                  </h4>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Previous / Next Entry Navigation */}
        <nav className="mt-12 pt-8 border-t border-[#E5E3DB] flex items-center justify-between text-xs font-mono-archival">
          {prev ? (
            <button
              onClick={() => onNavigate({ page: 'entry', slug: prev.slug })}
              className="flex items-center space-x-2 text-[#6E6E66] hover:text-[#141413] max-w-[45%]"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Entry {prev.entryNumber}: {prev.title}</span>
            </button>
          ) : <div />}

          <button
            onClick={() => onNavigate({ page: 'laboratory' })}
            className="text-[#8C8C82] hover:text-[#9E2A2B] uppercase tracking-wider"
          >
            Laboratory Index
          </button>

          {next ? (
            <button
              onClick={() => onNavigate({ page: 'entry', slug: next.slug })}
              className="flex items-center space-x-2 text-[#6E6E66] hover:text-[#141413] max-w-[45%] text-right"
            >
              <span className="truncate">Entry {next.entryNumber}: {next.title}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : <div />}
        </nav>
      </div>
    </article>
  );
};
