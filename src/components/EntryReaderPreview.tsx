import React from 'react';
import { X, Calendar, Layers, Eye, MapPin, Compass, FileText } from 'lucide-react';
import { Entry, Collection, Study, Thread } from '../types';
import { EntryBodyRenderer } from './EntryBodyRenderer';
import { EntryMetadataHeader } from './EntryMetadataHeader';

interface EntryReaderPreviewProps {
  entry: Partial<Entry> & {
    title: string;
    blocks: Entry['blocks'];
  };
  collection?: Collection;
  study?: Study;
  threads?: Thread[];
  relatedStudies?: Study[];
  relatedEntries?: Entry[];
  onClose: () => void;
}

export const EntryReaderPreview: React.FC<EntryReaderPreviewProps> = ({
  entry,
  collection,
  study,
  threads = [],
  relatedStudies = [],
  relatedEntries = [],
  onClose,
}) => {
  const fullEntry: Entry = {
    id: entry.id || 'preview-entry',
    slug: entry.slug || 'preview-entry',
    entryNumber: entry.entryNumber || '000',
    collectionId: entry.collectionId || collection?.id || '',
    studyId: entry.studyId || study?.id || '',
    title: entry.title || 'Untitled Archival Entry',
    subtitle: entry.subtitle,
    ruiRevision: entry.ruiRevision || null,
    medium: entry.medium || 'Research / Inquiry',
    createdDate: entry.createdDate || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    publishedDate: entry.publishedDate || entry.createdDate || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    displayDate: entry.displayDate,
    location: entry.location,
    threadIds: entry.threadIds || threads.map((t) => t.id),
    relatedStudyIds: entry.relatedStudyIds || relatedStudies.map((s) => s.id),
    relatedEntryIds: entry.relatedEntryIds || relatedEntries.map((e) => e.id),
    summary: entry.summary,
    excerpt: entry.excerpt,
    blocks: entry.blocks || [],
    visibility: entry.visibility || 'published',
    featuredOnHome: entry.featuredOnHome,
    homeLayoutWeight: entry.homeLayoutWeight || 'standard',
    coverImage: entry.coverImage,
    coverImageCaption: entry.coverImageCaption,
    coverImageAlt: entry.coverImageAlt,
    metadata: entry.metadata,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 lg:p-10">
      <div className="relative w-full max-w-4xl bg-[#FBFBFA] border border-[#E5E3DB] shadow-2xl text-[#141413] my-8 animate-fade-in">
        {/* Sticky Preview Banner */}
        <div className="sticky top-0 z-10 bg-[#141413] text-[#FBFBFA] px-6 py-3 flex items-center justify-between border-b border-[#333330]">
          <div className="flex items-center space-x-2 text-xs font-mono-archival">
            <span className="text-[#9E2A2B] font-bold">[ READER PREVIEW ]</span>
            <span className="text-[#8C8C82]">•</span>
            <span className="text-[#FBFBFA] font-medium truncate max-w-sm sm:max-w-md">
              ENTRY {fullEntry.entryNumber}: {fullEntry.title}
            </span>
            <span className="text-[#8C8C82]">({(fullEntry.visibility || 'published').toUpperCase()})</span>
            {fullEntry.featuredOnHome && (
              <span className="px-1.5 py-0.5 bg-[#9E2A2B] text-white text-[10px] font-semibold">
                HOME FEATURED
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2C2C28] text-[#8C8C82] hover:text-[#FBFBFA] transition-colors rounded-xs"
            title="Close Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reader Article Body */}
        <article className="p-6 sm:p-10 md:p-14 space-y-8">
          {/* Rigid Archival Metadata Framework Header */}
          <EntryMetadataHeader
            entry={fullEntry}
            collection={collection}
            study={study}
            threads={threads}
          />

          {/* Header */}
          <header className="space-y-3 pt-4 pb-6 border-b border-[#E5E3DB]">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium leading-[1.15]">
              {fullEntry.title}
            </h1>

            {fullEntry.subtitle && (
              <p className="font-serif text-lg text-[#6E6E66] italic">
                {fullEntry.subtitle}
              </p>
            )}

            {fullEntry.summary && (
              <p className="font-serif text-base sm:text-lg text-[#5C5C54] italic leading-relaxed">
                {fullEntry.summary}
              </p>
            )}
          </header>

          {/* Optional Cover Image */}
          {fullEntry.coverImage && (
            <figure className="my-6">
              <img
                src={fullEntry.coverImage}
                alt={fullEntry.coverImageAlt || fullEntry.title}
                className="w-full max-h-[560px] object-cover border border-[#E5E3DB] bg-[#F4F3EE]"
              />
              {fullEntry.coverImageCaption && (
                <figcaption className="text-xs font-mono-archival text-[#8C8C82] mt-2 italic">
                  {fullEntry.coverImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Extended Metadata Grid if available */}
          {fullEntry.metadata && Object.keys(fullEntry.metadata).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F4F3EE] border border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66]">
              {fullEntry.metadata.readingTime && (
                <div>
                  <span className="block text-[#8C8C82] text-[10px] uppercase">Reading Time</span>
                  <span className="text-[#141413]">{fullEntry.metadata.readingTime}</span>
                </div>
              )}
              {fullEntry.metadata.medium && (
                <div>
                  <span className="block text-[#8C8C82] text-[10px] uppercase">Specific Medium</span>
                  <span className="text-[#141413]">{fullEntry.metadata.medium}</span>
                </div>
              )}
              {fullEntry.metadata.dimensions && (
                <div>
                  <span className="block text-[#8C8C82] text-[10px] uppercase">Dimensions</span>
                  <span className="text-[#141413]">{fullEntry.metadata.dimensions}</span>
                </div>
              )}
              {fullEntry.metadata.edition && (
                <div>
                  <span className="block text-[#8C8C82] text-[10px] uppercase">Edition</span>
                  <span className="text-[#141413]">{fullEntry.metadata.edition}</span>
                </div>
              )}
            </div>
          )}

          {/* Flexible Content Blocks */}
          <EntryBodyRenderer blocks={fullEntry.blocks} />

          {/* Related Studies Cross-References */}
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
                    className="p-3 bg-[#FBFBFA] border border-[#E5E3DB]"
                  >
                    <span className="text-[10px] font-mono-archival text-[#8C8C82] block">
                      STUDY #{s.order}
                    </span>
                    <h4 className="font-serif text-sm text-[#141413] font-medium">
                      {s.title}
                    </h4>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Entries Cross-References */}
          {relatedEntries.length > 0 && (
            <section className="mt-6 pt-6 border-t border-[#E5E3DB] bg-[#FBFBFA] p-5 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#141413] uppercase tracking-wider font-semibold">
                <FileText className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>Related Archival Entries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedEntries.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-3 bg-[#F4F3EE] border border-[#E5E3DB] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono-archival text-[#8C8C82]">
                      <span>ENTRY {rel.entryNumber}</span>
                      {rel.medium && <span className="text-[#9E2A2B]">{rel.medium}</span>}
                    </div>
                    <h4 className="font-serif text-sm text-[#141413] font-medium truncate">
                      {rel.title}
                    </h4>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  );
};
