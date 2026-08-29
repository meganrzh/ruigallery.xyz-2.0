import React from 'react';
import { ArrowLeft, FolderKanban, BookOpen, Calendar, MapPin, Tag } from 'lucide-react';
import { AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface CollectionDetailProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

export const CollectionDetail: React.FC<CollectionDetailProps> = ({ slug, onNavigate }) => {
  const { getCollection, getStudiesByCollection, getEntriesByCollection, getThread } = useArchive();
  const collection = getCollection(slug);

  if (!collection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-[#141413]">Collection not found</h2>
        <button
          onClick={() => onNavigate({ page: 'laboratory' })}
          className="mt-4 text-xs font-mono-archival text-[#9E2A2B] underline"
        >
          Return to Laboratory
        </button>
      </div>
    );
  }

  const studies = getStudiesByCollection(collection.id);
  const entries = getEntriesByCollection(collection.id);

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => onNavigate({ page: 'laboratory' })}
            className="inline-flex items-center space-x-1.5 text-xs font-mono-archival text-[#6E6E66] hover:text-[#141413] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Laboratory / Collections</span>
          </button>
        </div>

        {/* Collection Header */}
        <header className="space-y-4 pb-8 border-b border-[#E5E3DB]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
            <div className="flex items-center space-x-2">
              <span className="text-[#9E2A2B] font-semibold uppercase">COLLECTION</span>
              <span>•</span>
              <span>{collection.period}</span>
            </div>
            <span>ID: {collection.id.toUpperCase()}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium leading-tight">
            {collection.title}
          </h1>

          {collection.subtitle && (
            <p className="font-serif text-lg sm:text-xl text-[#5C5C54] italic">
              {collection.subtitle}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#EFEFEA] text-xs font-mono-archival text-[#6E6E66]">
            <div>
              <span className="block text-[#8C8C82] text-[10px] uppercase">Associated Studies</span>
              <span className="text-[#141413] font-medium">{studies.length} Studies</span>
            </div>
            <div>
              <span className="block text-[#8C8C82] text-[10px] uppercase">Cataloged Entries</span>
              <span className="text-[#141413] font-medium">{entries.length} Entries</span>
            </div>
            {collection.locationContext && (
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase">Geographic Context</span>
                <span className="text-[#141413]">{collection.locationContext}</span>
              </div>
            )}
          </div>
        </header>

        {/* Narrative Description */}
        <div className="font-serif text-lg sm:text-xl text-[#2C2C28] leading-relaxed max-w-prose">
          {collection.description}
        </div>

        {/* Associated Studies Grid */}
        <section className="space-y-6 pt-6 border-t border-[#E5E3DB]">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#141413] font-medium">
              Studies within this Collection ({studies.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studies.map((study) => {
              const entriesInStudy = entries.filter((e) => e.studyId === study.id);

              return (
                <div
                  key={study.id}
                  onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                  className="p-5 bg-[#F4F3EE] border border-[#E5E3DB] hover:border-[#141413] cursor-pointer transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                      <span>STUDY #{study.order}</span>
                      <span>{entriesInStudy.length} Entries</span>
                    </div>

                    <h3 className="font-serif text-xl text-[#141413] font-medium hover:text-[#9E2A2B] transition-colors leading-snug">
                      {study.title}
                    </h3>

                    {study.subtitle && (
                      <p className="font-serif text-xs text-[#6E6E66] italic">
                        {study.subtitle}
                      </p>
                    )}

                    <p className="font-serif text-xs text-[#4A4A44] leading-relaxed line-clamp-3">
                      {study.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E3DB] flex items-center justify-between text-xs font-mono-archival">
                    <span className="text-[#8C8C82]">Active since {study.createdDate}</span>
                    <span className="text-[#141413] font-medium hover:underline">
                      Enter Study &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Chronological Sequence of Entries in Collection */}
        <section className="space-y-4 pt-10 border-t border-[#E5E3DB]">
          <h2 className="font-serif text-2xl text-[#141413] font-medium">
            Chronological Entries ({entries.length})
          </h2>

          <div className="divide-y divide-[#E5E3DB] border-y border-[#E5E3DB]">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                className="py-4 px-2 hover:bg-[#F4F3EE] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center space-x-3 text-xs font-mono-archival text-[#8C8C82]">
                  <span className="text-[#141413] font-medium">{entry.createdDate}</span>
                  <span>ENTRY {entry.entryNumber}</span>
                  <span className="text-[#9E2A2B]">{entry.ruiRevision}</span>
                </div>
                <div className="font-serif text-base text-[#141413] hover:text-[#9E2A2B] font-medium flex-1 sm:px-4">
                  {entry.title}
                </div>
                <div className="text-xs font-mono-archival text-[#8C8C82] sm:text-right">
                  {entry.location || '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
