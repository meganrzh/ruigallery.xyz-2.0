import React from 'react';
import { ArrowLeft, ArrowRight, Compass, Calendar, MapPin, Clock, Layers } from 'lucide-react';
import { CuratedWork, AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface CuratedWorkDetailProps {
  slug: string;
  onNavigate: (view: AppView) => void;
}

export const CuratedWorkDetail: React.FC<CuratedWorkDetailProps> = ({ slug, onNavigate }) => {
  const { getCuratedWork, getRelatedStudiesForWork, getRelatedEntriesForWork, getNextPrevWork } = useArchive();
  const work = getCuratedWork(slug);

  if (!work) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-[#141413]">Work not found</h2>
        <button
          onClick={() => onNavigate({ page: 'home' })}
          className="mt-4 text-xs font-mono-archival text-[#9E2A2B] underline"
        >
          Return to Curated Gallery
        </button>
      </div>
    );
  }

  const { prev, next } = getNextPrevWork(work.id);
  const relatedStudies = getRelatedStudiesForWork(work);
  const relatedEntries = getRelatedEntriesForWork(work);

  return (
    <article className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-10">
          <button
            onClick={() => onNavigate({ page: 'home' })}
            className="inline-flex items-center space-x-1.5 text-xs font-mono-archival text-[#6E6E66] hover:text-[#141413] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Curated Works / Gallery</span>
          </button>
        </div>

        {/* Title Header */}
        <header className="space-y-4 pb-8 border-b border-[#E5E3DB]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
            <div className="flex items-center space-x-3">
              <span className="text-[#9E2A2B] font-medium uppercase tracking-wider">{work.workType}</span>
              <span>•</span>
              <span>{work.year}</span>
            </div>
            <span>CATALOG ID: {work.id.toUpperCase()}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#141413] font-medium leading-[1.1]">
            {work.title}
          </h1>

          {work.subtitle && (
            <p className="font-serif text-lg sm:text-xl text-[#5C5C54] italic leading-relaxed">
              {work.subtitle}
            </p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#EFEFEA] text-xs font-mono-archival text-[#6E6E66]">
            {work.date && (
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase">Date</span>
                <span className="text-[#141413]">{work.date}</span>
              </div>
            )}
            {work.metadata?.medium && (
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase">Medium</span>
                <span className="text-[#141413]">{work.metadata.medium}</span>
              </div>
            )}
            {work.metadata?.location && (
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase">Location</span>
                <span className="text-[#141413]">{work.metadata.location}</span>
              </div>
            )}
            {work.metadata?.edition && (
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase">Edition / Spec</span>
                <span className="text-[#141413]">{work.metadata.edition}</span>
              </div>
            )}
          </div>
        </header>

        {/* Lead Excerpt */}
        <div className="py-8">
          <p className="font-serif text-xl sm:text-2xl text-[#2C2C28] leading-relaxed italic border-l-2 border-[#9E2A2B] pl-6 my-4">
            {work.excerpt}
          </p>
        </div>

        {/* Main Cover Imagery */}
        <div className="my-8">
          <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
            <img
              src={work.coverImage}
              alt={work.title}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[700px] object-cover"
            />
          </div>
          <p className="text-xs font-mono-archival text-[#8C8C82] mt-2 text-right">
            Plate I — Primary documentation capture for {work.title}.
          </p>
        </div>

        {/* Dynamic Body Blocks */}
        <div className="space-y-10 my-12 text-[#141413]">
          {work.bodyBlocks && work.bodyBlocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <div key={idx} className="font-serif text-lg sm:text-xl text-[#2C2C28] leading-relaxed max-w-prose">
                  {block.content}
                </div>
              );
            }

            if (block.type === 'pullquote') {
              return (
                <div key={idx} className="my-12 py-8 px-8 bg-[#F4F3EE] border-y border-[#E5E3DB] text-center space-y-3">
                  <blockquote className="font-serif text-xl sm:text-2xl text-[#141413] italic leading-relaxed">
                    “{block.quote}”
                  </blockquote>
                  {block.attribution && (
                    <cite className="block text-xs font-mono-archival text-[#8C8C82] not-italic">
                      — {block.attribution}
                    </cite>
                  )}
                </div>
              );
            }

            if (block.type === 'image') {
              return (
                <div key={idx} className="my-10 space-y-2">
                  <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
                    <img
                      src={block.url}
                      alt={block.caption || 'Plate visual'}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  {block.caption && (
                    <p className="text-xs font-mono-archival text-[#8C8C82] text-center italic">
                      {block.caption}
                    </p>
                  )}
                </div>
              );
            }

            if (block.type === 'two_column_images') {
              return (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-10">
                  <div className="space-y-2">
                    <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
                      <img
                        src={block.url1}
                        alt="Plate view A"
                        referrerPolicy="no-referrer"
                        className="w-full h-64 sm:h-80 object-cover"
                      />
                    </div>
                    {block.caption1 && (
                      <p className="text-[11px] font-mono-archival text-[#8C8C82] text-center">
                        {block.caption1}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
                      <img
                        src={block.url2}
                        alt="Plate view B"
                        referrerPolicy="no-referrer"
                        className="w-full h-64 sm:h-80 object-cover"
                      />
                    </div>
                    {block.caption2 && (
                      <p className="text-[11px] font-mono-archival text-[#8C8C82] text-center">
                        {block.caption2}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Laboratory Cross-References */}
        {(relatedStudies.length > 0 || relatedEntries.length > 0) && (
          <section className="mt-16 pt-8 border-t border-[#E5E3DB] bg-[#F4F3EE] p-6 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#9E2A2B] uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Laboratory Connections &amp; Exploratory Traces</span>
            </div>
            <p className="font-serif text-sm text-[#4A4A44]">
              This curated work originated from and directly intersects with research studies cataloged in the Laboratory archive:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {relatedStudies.map((study) => (
                <div
                  key={study.id}
                  onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                  className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#9E2A2B] cursor-pointer transition-colors space-y-1"
                >
                  <span className="text-[10px] font-mono-archival text-[#8C8C82]">STUDY INQUIRY</span>
                  <h4 className="font-serif text-sm text-[#141413] font-medium hover:text-[#9E2A2B]">
                    {study.title} &rarr;
                  </h4>
                </div>
              ))}

              {relatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                  className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#9E2A2B] cursor-pointer transition-colors space-y-1"
                >
                  <span className="text-[10px] font-mono-archival text-[#8C8C82]">
                    ENTRY {entry.entryNumber} ({entry.ruiRevision})
                  </span>
                  <h4 className="font-serif text-sm text-[#141413] font-medium hover:text-[#9E2A2B]">
                    {entry.title} &rarr;
                  </h4>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Previous / Next Navigation */}
        <nav className="mt-16 pt-8 border-t border-[#E5E3DB] flex items-center justify-between text-xs font-mono-archival">
          {prev ? (
            <button
              onClick={() => onNavigate({ page: 'work', slug: prev.slug })}
              className="flex items-center space-x-2 text-[#6E6E66] hover:text-[#141413] max-w-[45%]"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">&larr; {prev.title}</span>
            </button>
          ) : <div />}

          <button
            onClick={() => onNavigate({ page: 'home' })}
            className="text-[#8C8C82] hover:text-[#9E2A2B] uppercase tracking-wider"
          >
            Index
          </button>

          {next ? (
            <button
              onClick={() => onNavigate({ page: 'work', slug: next.slug })}
              className="flex items-center space-x-2 text-[#6E6E66] hover:text-[#141413] max-w-[45%] text-right"
            >
              <span className="truncate">{next.title} &rarr;</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : <div />}
        </nav>
      </div>
    </article>
  );
};
