import React from 'react';
import { Mail, MapPin, Globe, ArrowUpRight, Award, Briefcase, Building, Layers } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';

export const AboutView: React.FC = () => {
  const { aboutData, professionalItems } = useArchive();

  const experienceItems = professionalItems.filter((i) => i.category === 'experience');
  const organizationItems = professionalItems.filter((i) => i.category === 'organization');
  const exhibitionItems = professionalItems.filter((i) => i.category === 'exhibition');
  const publicationItems = professionalItems.filter((i) => i.category === 'publication');
  const collaborationItems = professionalItems.filter((i) => i.category === 'collaboration');

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1 — Header & Personal Bio */}
        <header className="space-y-6 pb-10 border-b border-[#E5E3DB]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
            <div className="flex items-center space-x-2">
              <span className="text-[#9E2A2B] font-semibold">ECOSYSTEM</span>
              <span>•</span>
              <span>RUI / 睿</span>
            </div>
            <span>LOC: {aboutData.contact.location}</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#141413] font-medium leading-tight">
              {aboutData.name}{' '}
              <span className="font-chinese text-3xl sm:text-4xl text-[#9E2A2B] font-normal pl-2">
                {aboutData.chineseName}
              </span>
            </h1>
            <p className="font-serif text-xl text-[#5C5C54] italic">
              {aboutData.title}
            </p>
          </div>

          {/* Narrative Bio */}
          <div className="space-y-4 pt-4 text-base sm:text-lg font-serif text-[#2C2C28] leading-relaxed">
            {aboutData.bio.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </header>

        {/* Section 2 — Artistic & Archival Philosophy */}
        <section className="space-y-8 pb-12 border-b border-[#E5E3DB]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E3DB]">
            <span className="text-xs font-mono-archival text-[#8C8C82] uppercase tracking-wider">
              PHILOSOPHICAL ANCHORS
            </span>
            <span className="text-xs font-mono-archival text-[#9E2A2B]">
              {aboutData.philosophy.propositions.length} PRINCIPLES
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium">
            {aboutData.philosophy.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aboutData.philosophy.propositions.map((prop) => (
              <div
                key={prop.num}
                className="p-6 bg-[#F4F3EE] border border-[#E5E3DB] space-y-3"
              >
                <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82]">
                  <span className="font-semibold text-[#9E2A2B]">PROPOSITION {prop.num}</span>
                </div>
                <h3 className="font-serif text-lg text-[#141413] font-medium leading-snug">
                  {prop.heading}
                </h3>
                <p className="font-serif text-sm text-[#4A4A44] leading-relaxed">
                  {prop.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Professional Ecosystem & Résumé */}
        <section className="space-y-12 pb-12 border-b border-[#E5E3DB]">
          <div className="space-y-2">
            <span className="text-xs font-mono-archival text-[#8C8C82] uppercase tracking-wider">
              STRUCTURED PRACTICE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium">
              Professional Ecosystem
            </h2>
            <p className="font-serif text-sm text-[#6E6E66] italic max-w-xl">
              Systems architecture, editorial research, and cultural advisory viewed as direct continuations of the studio inquiry.
            </p>
          </div>

          {/* Experience Timeline */}
          <div className="space-y-6">
            <h3 className="text-xs font-mono-archival uppercase text-[#141413] pb-2 border-b border-[#E5E3DB] flex items-center space-x-2">
              <Briefcase className="w-3.5 h-3.5 text-[#8C8C82]" />
              <span>Directorial &amp; Spatial Research Experience</span>
            </h3>

            <div className="space-y-8">
              {experienceItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs font-mono-archival">
                    <span className="text-base font-serif font-medium text-[#141413]">
                      {item.title}
                    </span>
                    <span className="text-[#8C8C82]">{item.period}</span>
                  </div>

                  <div className="text-xs font-mono-archival text-[#6E6E66] flex items-center space-x-2">
                    <span className="text-[#9E2A2B] font-medium">{item.entity}</span>
                    {item.location && <span>• {item.location}</span>}
                  </div>

                  <p className="font-serif text-sm text-[#3C3C38] leading-relaxed pt-1">
                    {item.description}
                  </p>

                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className="text-[10px] font-mono-archival px-1.5 py-0.2 bg-[#F4F3EE] border border-[#E5E3DB] text-[#6E6E66]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Organizations & Institutional Advisory */}
          {organizationItems.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-mono-archival uppercase text-[#141413] pb-2 border-b border-[#E5E3DB] flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-[#8C8C82]" />
                <span>Organizations &amp; Advisory Boards</span>
              </h3>

              <div className="space-y-4">
                {organizationItems.map((item) => (
                  <div key={item.id} className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                      <span className="font-serif text-sm text-[#141413] font-medium">
                        {item.title} — {item.entity}
                      </span>
                      <span>{item.period}</span>
                    </div>
                    <p className="font-serif text-xs text-[#4A4A44] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Exhibitions & Publications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Exhibitions */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono-archival uppercase text-[#141413] pb-2 border-b border-[#E5E3DB]">
                Selected Exhibitions
              </h3>
              <div className="space-y-4">
                {exhibitionItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="text-xs font-mono-archival text-[#8C8C82] flex justify-between">
                      <span>{item.period}</span>
                      <span>{item.location}</span>
                    </div>
                    <h4 className="font-serif text-sm font-medium text-[#141413]">
                      {item.title}
                    </h4>
                    <p className="text-xs font-serif text-[#6E6E66]">
                      {item.entity}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Publications & Collaborations */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono-archival uppercase text-[#141413] pb-2 border-b border-[#E5E3DB]">
                Publications &amp; Collaborations
              </h3>
              <div className="space-y-4">
                {publicationItems.concat(collaborationItems).map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="text-xs font-mono-archival text-[#8C8C82]">
                      {item.period}
                    </div>
                    <h4 className="font-serif text-sm font-medium text-[#141413]">
                      {item.title}
                    </h4>
                    <p className="text-xs font-serif text-[#6E6E66]">
                      {item.entity} — {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 — Contact & Studio Repository */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono-archival text-[#8C8C82] uppercase tracking-wider">
              CORRESPONDENCE &amp; DISPATCH
            </span>
            <h2 className="font-serif text-2xl text-[#141413] font-medium">
              Contact &amp; Transmissions
            </h2>
          </div>

          <div className="p-6 bg-[#F4F3EE] border border-[#E5E3DB] space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono-archival">
              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase mb-1">Direct Inquiries</span>
                <a
                  href={`mailto:${aboutData.contact.email}`}
                  className="font-serif text-base text-[#141413] hover:text-[#9E2A2B] underline"
                >
                  {aboutData.contact.email}
                </a>
              </div>

              <div>
                <span className="block text-[#8C8C82] text-[10px] uppercase mb-1">Studio Coordinates</span>
                <span className="font-serif text-base text-[#141413]">
                  {aboutData.contact.location}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E3DB] flex flex-wrap gap-4 text-xs font-mono-archival">
              {aboutData.contact.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#141413] hover:text-[#9E2A2B] border-b border-[#141413] hover:border-[#9E2A2B] pb-0.5"
                >
                  <span>{link.name}</span>
                  {link.handle && <span className="text-[#8C8C82]">({link.handle})</span>}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
