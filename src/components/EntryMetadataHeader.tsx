import React from 'react';
import { Entry, Collection, Study, Thread, AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface EntryMetadataHeaderProps {
  entry: Entry;
  collection?: Collection;
  study?: Study;
  threads: Thread[];
  onNavigate: (view: AppView) => void;
}

export const EntryMetadataHeader: React.FC<EntryMetadataHeaderProps> = ({
  entry,
  collection,
  study,
  threads,
  onNavigate,
}) => {
  return (
    <div className="border border-[#E5E3DB] bg-[#F4F3EE]/60 text-xs font-mono-archival">
      {/* Top Banner: ID & System Status */}
      <div className="px-4 py-2 bg-[#EAE8E0] border-b border-[#E5E3DB] flex flex-wrap items-center justify-between gap-2 text-[#6E6E66]">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-[#141413]">
            ENTRY {entry.entryNumber}
          </span>
          <span className="text-[#8C8C82]">•</span>
          <span className="px-1.5 py-0.5 bg-[#FBFBFA] border border-[#D5D3CB] text-[#9E2A2B] font-semibold">
            {entry.ruiRevision}
          </span>
          {entry.visibility === 'draft' && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px]">
              DRAFT
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-[#8C8C82] text-[11px]">
          <span>CREATED: {entry.createdDate}</span>
          {entry.lastModifiedDate && entry.lastModifiedDate !== entry.createdDate && (
            <span>(MODIFIED: {entry.lastModifiedDate})</span>
          )}
        </div>
      </div>

      {/* Structured Metadata Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6">
        {/* Collection */}
        <div>
          <span className="block text-[10px] text-[#8C8C82] uppercase tracking-wider">
            Collection
          </span>
          {collection ? (
            <button
              onClick={() => onNavigate({ page: 'collection', slug: collection.slug })}
              className="text-[#141413] hover:text-[#9E2A2B] font-medium text-left truncate block max-w-full underline decoration-dotted underline-offset-2"
            >
              {collection.title}
            </button>
          ) : (
            <span className="text-[#8C8C82]">—</span>
          )}
        </div>

        {/* Study */}
        <div>
          <span className="block text-[10px] text-[#8C8C82] uppercase tracking-wider">
            Study
          </span>
          {study ? (
            <button
              onClick={() => onNavigate({ page: 'study', slug: study.slug })}
              className="text-[#141413] hover:text-[#9E2A2B] font-medium text-left truncate block max-w-full underline decoration-dotted underline-offset-2"
            >
              {study.title}
            </button>
          ) : (
            <span className="text-[#8C8C82]">—</span>
          )}
        </div>

        {/* Location */}
        <div>
          <span className="block text-[10px] text-[#8C8C82] uppercase tracking-wider">
            Location
          </span>
          <span className="text-[#141413]">
            {entry.location || 'Unspecified Coordinate'}
          </span>
        </div>

        {/* Threads */}
        <div>
          <span className="block text-[10px] text-[#8C8C82] uppercase tracking-wider">
            Threads
          </span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {threads.length > 0 ? (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onNavigate({ page: 'archive', initialThread: t.id })}
                  className="px-1.5 py-0.2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#4A4A44] hover:text-[#9E2A2B] hover:border-[#9E2A2B] text-[10px] transition-colors"
                >
                  {t.name}
                </button>
              ))
            ) : (
              <span className="text-[#8C8C82]">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
