import React from 'react';
import { X, Calendar, Layers, Eye } from 'lucide-react';
import { CuratedWork, Entry, Study } from '../types';

interface CuratedWorkReaderPreviewProps {
  work: CuratedWork;
  relatedStudies: Study[];
  relatedEntries: Entry[];
  onClose: () => void;
}

export const CuratedWorkReaderPreview: React.FC<CuratedWorkReaderPreviewProps> = ({
  work,
  relatedStudies,
  relatedEntries,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 lg:p-10">
      <div className="relative w-full max-w-4xl bg-[#FBFBFA] border border-[#E5E3DB] shadow-2xl text-[#141413] my-8 animate-fade-in">
        {/* Sticky Preview Banner */}
        <div className="sticky top-0 z-10 bg-[#141413] text-[#FBFBFA] px-6 py-3 flex items-center justify-between border-b border-[#333330]">
          <div className="flex items-center space-x-2 text-xs font-mono-archival">
            <span className="text-[#9E2A2B] font-bold">[ READER PREVIEW ]</span>
            <span className="text-[#8C8C82]">•</span>
            <span className="text-[#FBFBFA] font-medium">{work.title || 'Untitled Work'}</span>
            <span className="text-[#8C8C82]">({work.visibility.toUpperCase()})</span>
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
          {/* Header */}
          <header className="space-y-4 pb-8 border-b border-[#E5E3DB]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
              <div className="flex items-center space-x-3">
                <span className="text-[#9E2A2B] font-medium uppercase tracking-wider">{work.workType}</span>
                <span>•</span>
                <span>{work.year || '2026'}</span>
              </div>
              <span>CATALOG ID: {work.id.toUpperCase()}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium leading-[1.1]">
              {work.title || 'Untitled Curated Work'}
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

          {/* Excerpt */}
          {work.excerpt && (
            <div className="py-4">
              <p className="font-serif text-xl sm:text-2xl text-[#2C2C28] leading-relaxed italic border-l-2 border-[#9E2A2B] pl-6 my-2">
                {work.excerpt}
              </p>
            </div>
          )}

          {/* Cover Imagery */}
          {work.coverImage && (
            <div className="my-6">
              <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
                <img
                  src={work.coverImage}
                  alt={work.coverImageAlt || work.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[600px] object-cover"
                />
              </div>
              {work.coverImageCaption && (
                <p className="text-xs font-mono-archival text-[#8C8C82] mt-2 text-right">
                  {work.coverImageCaption}
                </p>
              )}
            </div>
          )}

          {/* Body Blocks */}
          <div className="space-y-10 my-8 text-[#141413]">
            {work.bodyBlocks && work.bodyBlocks.length > 0 ? (
              work.bodyBlocks.map((block, idx) => {
                if (block.type === 'text') {
                  return (
                    <div
                      key={idx}
                      className="font-serif text-lg sm:text-xl text-[#2C2C28] leading-relaxed max-w-prose whitespace-pre-line"
                    >
                      {block.content}
                    </div>
                  );
                }

                if (block.type === 'pullquote') {
                  return (
                    <div
                      key={idx}
                      className="my-10 py-8 px-8 bg-[#F4F3EE] border-y border-[#E5E3DB] text-center space-y-3"
                    >
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
                    <div key={idx} className="my-8 space-y-2">
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
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
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
              })
            ) : (
              <div className="p-8 text-center text-xs font-mono-archival text-[#8C8C82] border border-dashed border-[#E5E3DB]">
                (No body blocks authored yet)
              </div>
            )}
          </div>

          {/* Related Associations Section */}
          <div className="pt-10 border-t border-[#E5E3DB] space-y-6">
            <h3 className="font-serif text-lg text-[#141413] font-medium">
              Archival Provenance &amp; Cross-References
            </h3>

            {relatedStudies.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono-archival uppercase text-[#8C8C82] tracking-wider block">
                  Grounding Field Studies ({relatedStudies.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedStudies.map((s) => (
                    <div key={s.id} className="p-3 border border-[#E5E3DB] bg-[#F4F3EE] text-xs font-mono-archival">
                      <span className="font-semibold text-[#141413]">{s.title}</span>
                      {s.subtitle && <p className="text-[#6E6E66] font-serif italic">{s.subtitle}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedEntries.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono-archival uppercase text-[#8C8C82] tracking-wider block">
                  Referenced Primary Entries ({relatedEntries.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedEntries.map((e) => (
                    <div key={e.id} className="p-3 border border-[#E5E3DB] bg-[#F4F3EE] text-xs font-mono-archival">
                      <span className="text-[#9E2A2B] font-semibold block">ENTRY {e.entryNumber}</span>
                      <span className="font-medium text-[#141413]">{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-6 border-t border-[#E5E3DB] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] text-xs font-mono-archival uppercase tracking-wider transition-colors"
            >
              Close Reader Preview
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
