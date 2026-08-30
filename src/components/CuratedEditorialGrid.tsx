import React from 'react';
import { ArrowUpRight, BookOpen, Compass, ExternalLink } from 'lucide-react';
import { CuratedWork, AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface CuratedEditorialGridProps {
  onNavigate: (view: AppView) => void;
}

export const CuratedEditorialGrid: React.FC<CuratedEditorialGridProps> = ({ onNavigate }) => {
  const { curatedWorks, getRelatedStudiesForWork, getRelatedEntriesForWork } = useArchive();

  const publishedWorks = curatedWorks.filter((w) => w.visibility === 'published' && w.featuredOnHome);

  if (publishedWorks.length === 0) {
    return null;
  }

  const dominantWork = publishedWorks[0];
  const secondaryWorks = publishedWorks.slice(1);

  return (
    <section id="curated-works-section" className="pt-8 pb-16 md:pt-10 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 pb-4 border-b border-[#E5E3DB]">
          <div>
            <span className="text-xs font-mono-archival text-[#8C8C82] tracking-wider uppercase">
              Curated Works / 01
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-[#141413] mt-1">
              Essays
            </h2>
          </div>
          <p className="font-serif text-sm text-[#6E6E66] max-w-md mt-2 md:mt-0 italic">
            Finished essays, photographic suites, and spatial editions. Resolved creative inquiries treated as peer disciplines.
          </p>
        </div>

        {/* Editorial Layout: Dominant Piece */}
        {dominantWork && (
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Large Image on Left / Top */}
              <div className="lg:col-span-8 group cursor-pointer" onClick={() => onNavigate({ page: 'work', slug: dominantWork.slug })}>
                <div className="relative overflow-hidden bg-[#F4F3EE] border border-[#E5E3DB]">
                  <img
                    src={dominantWork.coverImage}
                    alt={dominantWork.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[640px] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-4 left-4 bg-[#141413]/90 text-[#FBFBFA] px-2.5 py-1 text-[11px] font-mono-archival">
                    {dominantWork.workType} — {dominantWork.year}
                  </div>
                </div>
              </div>

              {/* Editorial Text & Metadata on Right */}
              <div className="lg:col-span-4 flex flex-col justify-between self-stretch space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82]">
                    <span>EDITION: {dominantWork.metadata?.edition || 'CATALOGED'}</span>
                    <span>•</span>
                    <span>{dominantWork.date}</span>
                  </div>

                  <h3
                    onClick={() => onNavigate({ page: 'work', slug: dominantWork.slug })}
                    className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#141413] hover:text-[#9E2A2B] transition-colors cursor-pointer leading-tight font-medium"
                  >
                    {dominantWork.title}
                  </h3>

                  {dominantWork.subtitle && (
                    <p className="font-serif text-base text-[#6E6E66] italic">
                      {dominantWork.subtitle}
                    </p>
                  )}

                  <p className="font-serif text-base text-[#3C3C38] leading-relaxed pt-2">
                    {dominantWork.excerpt}
                  </p>
                </div>

                {/* Laboratory Cross Reference */}
                <div className="pt-6 border-t border-[#E5E3DB] space-y-4">
                  {dominantWork.relatedStudyIds && dominantWork.relatedStudyIds.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono-archival text-[#8C8C82] uppercase flex items-center space-x-1">
                        <Compass className="w-3 h-3 text-[#9E2A2B]" />
                        <span>Laboratory Cross-Reference</span>
                      </span>
                      {getRelatedStudiesForWork(dominantWork).map((study) => (
                        <button
                          key={study.id}
                          onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                          className="block text-left text-xs font-serif text-[#141413] hover:text-[#9E2A2B] hover:underline"
                        >
                          &rarr; Study: {study.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    id={`work-open-${dominantWork.slug}`}
                    onClick={() => onNavigate({ page: 'work', slug: dominantWork.slug })}
                    className="group inline-flex items-center space-x-2 text-xs font-mono-archival tracking-wider uppercase py-2 text-[#141413] hover:text-[#9E2A2B] font-medium"
                  >
                    <span>Read / View Complete Work</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Asymmetrical Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 pt-8 border-t border-[#E5E3DB]">
          {secondaryWorks.map((work, index) => {
            const relatedStudies = getRelatedStudiesForWork(work);
            const relatedEntries = getRelatedEntriesForWork(work);

            return (
              <article
                key={work.id}
                className="flex flex-col justify-between space-y-4 group"
              >
                {/* Image */}
                <div
                  className="cursor-pointer overflow-hidden bg-[#F4F3EE] border border-[#E5E3DB]"
                  onClick={() => onNavigate({ page: 'work', slug: work.slug })}
                >
                  <img
                    src={work.coverImage}
                    alt={work.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-64 sm:h-72 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                    <span>{work.workType}</span>
                    <span>{work.year}</span>
                  </div>

                  <h3
                    onClick={() => onNavigate({ page: 'work', slug: work.slug })}
                    className="font-serif text-xl md:text-2xl text-[#141413] group-hover:text-[#9E2A2B] transition-colors cursor-pointer font-medium leading-snug"
                  >
                    {work.title}
                  </h3>

                  {work.subtitle && (
                    <p className="font-serif text-xs text-[#6E6E66] italic">
                      {work.subtitle}
                    </p>
                  )}

                  <p className="font-serif text-sm text-[#4A4A44] line-clamp-3 leading-relaxed">
                    {work.excerpt}
                  </p>
                </div>

                {/* Cross References & Action */}
                <div className="pt-3 border-t border-[#EFEFEA] space-y-2">
                  {relatedStudies.length > 0 && (
                    <div className="text-[11px] font-mono-archival text-[#8C8C82] truncate">
                      <span>Lab: </span>
                      <button
                        onClick={() => onNavigate({ page: 'study', slug: relatedStudies[0].slug })}
                        className="hover:text-[#9E2A2B] underline"
                      >
                        {relatedStudies[0].title}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onNavigate({ page: 'work', slug: work.slug })}
                    className="inline-flex items-center space-x-1.5 text-xs font-mono-archival text-[#141413] hover:text-[#9E2A2B] font-medium"
                  >
                    <span>View Dedicated Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
