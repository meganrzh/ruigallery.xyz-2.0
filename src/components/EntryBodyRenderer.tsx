import React from 'react';
import { EntryBlock } from '../types';
import { Quote, FileText, Bookmark, ExternalLink } from 'lucide-react';

interface EntryBodyRendererProps {
  blocks: EntryBlock[];
}

export const EntryBodyRenderer: React.FC<EntryBodyRendererProps> = ({ blocks }) => {
  return (
    <div className="space-y-8 my-8 text-[#141413]">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p
                key={idx}
                className="font-serif text-lg sm:text-xl text-[#2C2C28] leading-relaxed max-w-prose"
              >
                {block.content}
              </p>
            );

          case 'fragment':
            return (
              <div
                key={idx}
                className="p-5 my-6 bg-[#F4F3EE] border-l-2 border-[#141413] font-serif italic text-base sm:text-lg text-[#3A3A34] space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <Quote className="w-4 h-4 text-[#8C8C82] shrink-0 mt-1 not-italic" />
                  <p className="leading-relaxed">{block.note}</p>
                </div>
                {block.source && (
                  <span className="block text-xs font-mono-archival text-[#8C8C82] not-italic pl-6">
                    — {block.source}
                  </span>
                )}
              </div>
            );

          case 'image':
            return (
              <div key={idx} className="my-8 space-y-2">
                <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-1">
                  {/* Embedded document image - no gallery lightbox as specified */}
                  <img
                    src={block.url}
                    alt={block.alt || 'Archival document evidence'}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[560px] object-cover"
                  />
                </div>
                {(block.caption || block.scanInfo) && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono-archival text-[#6E6E66] px-1 gap-1">
                    {block.caption && <span className="italic">{block.caption}</span>}
                    {block.scanInfo && (
                      <span className="text-[#8C8C82] text-[11px]">
                        [{block.scanInfo}]
                      </span>
                    )}
                  </div>
                )}
              </div>
            );

          case 'observation':
            return (
              <div
                key={idx}
                className="p-4 my-6 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2 text-xs font-mono-archival"
              >
                <div className="flex items-center justify-between text-[#8C8C82] pb-2 border-b border-[#EFEFEA]">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#141413]">
                      FIELD OBSERVATION
                    </span>
                    {block.label && <span>• {block.label}</span>}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    {block.date && <span>{block.date}</span>}
                    {block.coordinates && <span>({block.coordinates})</span>}
                  </div>
                </div>
                <p className="font-serif text-base text-[#2C2C28] leading-relaxed pt-1">
                  {block.text}
                </p>
              </div>
            );

          case 'list':
            return (
              <div key={idx} className="my-6 p-5 bg-[#F4F3EE]/80 border border-[#E5E3DB] space-y-3">
                {block.title && (
                  <h4 className="text-xs font-mono-archival uppercase tracking-wider text-[#141413] font-medium pb-2 border-b border-[#E5E3DB]">
                    {block.title}
                  </h4>
                )}
                <ul className="space-y-2 text-sm font-serif text-[#3A3A34]">
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start space-x-2.5">
                      <span className="font-mono-archival text-xs text-[#8C8C82] shrink-0 mt-0.5">
                        {String(itemIdx + 1).padStart(2, '0')}.
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'reference':
            return (
              <div
                key={idx}
                className="my-4 p-3 bg-[#FBFBFA] border border-[#E5E3DB] flex items-start space-x-3 text-xs font-mono-archival text-[#4A4A44]"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#8C8C82] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] text-[#8C8C82] uppercase">Bibliographic Citation</span>
                  <p className="font-serif text-sm text-[#141413]">{block.citation}</p>
                  {block.link && (
                    <a
                      href={block.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] text-[#6E6E66] hover:text-[#141413] underline"
                    >
                      <span>External Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );

          case 'code_or_data':
            return (
              <div key={idx} className="my-6 border border-[#E5E3DB] bg-[#141413] text-[#FBFBFA] p-4 text-xs font-mono-archival overflow-x-auto space-y-2">
                {block.title && (
                  <div className="text-[11px] text-[#8C8C82] pb-2 border-b border-[#333330]">
                    {block.title}
                  </div>
                )}
                <pre className="text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {block.content}
                </pre>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
