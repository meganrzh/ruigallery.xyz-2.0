import React from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface AboutViewProps {
  onNavigate?: (view: AppView) => void;
}

const CONTACT_EMAIL = 'megan.rzh@gmail.com';
const STUDIO_COORDINATES = 'Los Angeles, California';

const PRACTICE_DIMENSIONS = [
  {
    area: 'Fashion & Material Systems',
    body: 'Professional work in fashion exposes me to systems of product, trend, taste, commercialization, and physical making.',
  },
  {
    area: 'Community & Nonprofit Work',
    body: 'Community and nonprofit work raises questions of governance, responsibility, institution-building, and collective identity.',
  },
  {
    area: 'Emerging Technologies',
    body: 'Emerging technologies introduce new possibilities for how knowledge and creative work are generated, organized, distributed, and understood.',
  },
  {
    area: 'Studio & Field Disciplines',
    body: 'Alongside these activities, I maintain practices in visual art, creative writing, philosophy, cultural research, and field study.',
  },
];

const QUANTIFYING_QUESTIONS = [
  {
    id: 'Q.01',
    question: 'Can novelty, originality, complexity, or divergence be meaningfully described?',
  },
  {
    id: 'Q.02',
    question: 'Can creative processes be modeled through their inputs, constraints, transformations, experimentation, and iteration?',
  },
  {
    id: 'Q.03',
    question: 'How does creative activity produce value, and how might that value be recognized without assuming that its highest expression is financial?',
  },
  {
    id: 'Q.04',
    question: 'How should creative work be supported, preserved, attributed, shared, and discovered?',
  },
  {
    id: 'Q.05',
    question: 'What kinds of technologies, markets, communities, and institutions allow creativity to remain abundant rather than extractive?',
  },
];

const RESEARCH_INTERSECTIONS = [
  { num: '01', label: 'Computational creativity' },
  { num: '02', label: 'Cognitive science' },
  { num: '03', label: 'Artificial intelligence' },
  { num: '04', label: 'Cultural economics' },
  { num: '05', label: 'Systems theory' },
  { num: '06', label: 'Philosophy' },
  { num: '07', label: 'Institutional design' },
  { num: '08', label: 'The arts' },
];

const DIRECTION_POSSIBILITIES = [
  {
    title: 'Creative Community',
    summary: 'Events, workshops, gatherings, artistic skill, identity, and collaboration.',
  },
  {
    title: 'Cultural & Artistic Research',
    summary: 'Chinese heritage, contemporary reinterpretation, artistic experimentation, and interdisciplinary inquiry.',
  },
  {
    title: 'Creative Technologies',
    summary: 'Computational creativity, modeling creative processes, and developing systems that make creative difference more legible.',
  },
];

const SECTION_INDEX = [
  { id: 'about-rui', num: '01', label: 'RUI' },
  { id: 'about-practice', num: '02', label: 'Practice as Method' },
  { id: 'about-quantifying', num: '03', label: 'Quantifying Creativity' },
  { id: 'about-technology', num: '04', label: 'Technology & Human Future' },
  { id: 'about-direction', num: '05', label: 'Direction' },
  { id: 'about-ongoing', num: '06', label: 'Ongoing Inquiry' },
];

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const { aboutData } = useArchive();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-20">
        {/* SECTION 01 — RUI */}
        <header id="about-rui" className="space-y-6 pb-12 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#6E6E66]">
            <div className="flex items-center space-x-2">
              <span className="text-[#9E2A2B] font-semibold">01 / ARCHIVE &amp; LABORATORY</span>
              <span>•</span>
              <span>RUI / 睿</span>
            </div>
            <span>LOC: {STUDIO_COORDINATES}</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#141413] font-medium leading-tight">
              {aboutData.name}{' '}
              <span className="font-chinese text-3xl sm:text-4xl text-[#9E2A2B] font-normal pl-2">
                {aboutData.chineseName}
              </span>
            </h1>
            <p className="font-serif text-xl sm:text-2xl text-[#4A4A44] italic leading-snug max-w-3xl">
              RUI is an evolving archive and laboratory for my creative and intellectual practice.
            </p>
          </div>

          <div className="space-y-4 pt-3 text-base sm:text-lg font-serif text-[#2C2C28] leading-relaxed max-w-3xl">
            <p>
              The work documented here begins with personal practice: writing, visual art, field observation, cultural study, community-building, and the ongoing construction of my own identity.
            </p>
            <p>
              These experiences form the primary material through which I develop broader ideas about creativity, technology, institutions, and collective life.
            </p>
            <p>
              The archive is both record and instrument. It traces how lived experience becomes inquiry, how inquiry moves across disciplines, and how abstract ideas eventually acquire material form.
            </p>
          </div>

          {/* Quiet Section Jump Index */}
          <nav
            aria-label="About page sections"
            className="pt-6 border-t border-[#EFEFEA] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono-archival text-[#6E6E66]"
          >
            {SECTION_INDEX.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="py-1.5 hover:text-[#9E2A2B] transition-colors text-left inline-flex items-baseline space-x-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9E2A2B]"
              >
                <span className="text-[#9E2A2B] tabular-nums">{item.num}</span>
                <span className="hover:underline">{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        {/* SECTION 02 — PRACTICE AS METHOD */}
        <section id="about-practice" className="space-y-8 pb-12 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="pb-2 border-b border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
            02 • PRACTICE AS METHOD
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium leading-snug max-w-2xl">
            My personal creative practice is the foundation of this inquiry.
          </h2>

          {/* Practice Threads — Open, unboxed editorial grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 pt-2">
            {PRACTICE_DIMENSIONS.map((dim) => (
              <div
                key={dim.area}
                className="pt-4 border-t border-[#EFEFEA] space-y-2"
              >
                <h3 className="font-serif text-lg text-[#141413] font-medium italic leading-snug">
                  {dim.area}
                </h3>
                <p className="font-serif text-base text-[#3C3C38] leading-relaxed">
                  {dim.body}
                </p>
              </div>
            ))}
          </div>

          {/* Points of Mutual Alteration */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-[#E5E3DB] items-baseline">
            <div className="md:col-span-4">
              <p className="font-serif text-lg text-[#141413] font-medium leading-snug">
                I do not experience these as separate disciplines.
              </p>
            </div>
            <div className="md:col-span-8 space-y-4">
              <p className="font-serif text-base sm:text-lg text-[#2C2C28] leading-relaxed">
                I am interested in the points where they alter one another: where artistic practice changes how I understand technology, where community-building reveals something about institutional design, where heritage becomes a source of experimentation, or where an abstract philosophical question becomes something that can be physically made.
              </p>
              <p className="font-serif text-base text-[#5C5C54] italic pt-2">
                RUI documents this process from the inside.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 03 — QUANTIFYING CREATIVITY (Most systematically structured & intellectually prominent) */}
        <section id="about-quantifying" className="space-y-10 pb-12 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E3DB] text-xs font-mono-archival">
            <span className="text-[#6E6E66] uppercase tracking-wider">
              03 • QUANTIFYING CREATIVITY
            </span>
            <span className="text-[#9E2A2B]">OPEN INQUIRY</span>
          </div>

          {/* Prominent Central Question Frame */}
          <div className="p-6 sm:p-10 bg-[#F4F3EE] border border-[#E5E3DB] space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-mono-archival text-[#9E2A2B] uppercase tracking-wider block">
                Central Long-Term Question
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#141413] font-medium leading-tight max-w-2xl">
                My long-term inquiry is what it means to quantify creativity.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#E5E3DB] font-serif text-base text-[#2C2C28] leading-relaxed">
              <p>
                I am interested in whether creativity can become more legible without being reduced to a single score, economic output, or market incentive.
              </p>
              <p>
                Creativity produces forms of value that are cultural, intellectual, emotional, social, and generative long before they become monetary.
              </p>
            </div>
          </div>

          {/* Open Research Questions */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EFEFEA]">
              <h3 className="text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
                Open Questions Under Investigation
              </h3>
              <span className="text-[11px] font-mono-archival text-[#6E6E66]">
                Descriptive Legibility Over Financial Reduction
              </span>
            </div>

            <div className="divide-y divide-[#EFEFEA]">
              {QUANTIFYING_QUESTIONS.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                >
                  <span className="sm:col-span-2 text-xs font-mono-archival text-[#9E2A2B] font-medium tabular-nums">
                    {item.id}
                  </span>
                  <p className="sm:col-span-10 font-serif text-base sm:text-lg text-[#141413] leading-relaxed">
                    {item.question}
                  </p>
                </div>
              ))}
            </div>

            <p className="font-serif text-base text-[#5C5C54] italic pt-2">
              These questions also have institutional implications.
            </p>

            <div className="divide-y divide-[#EFEFEA] border-t border-[#EFEFEA]">
              {QUANTIFYING_QUESTIONS.slice(3).map((item) => (
                <div
                  key={item.id}
                  className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                >
                  <span className="sm:col-span-2 text-xs font-mono-archival text-[#9E2A2B] font-medium tabular-nums">
                    {item.id}
                  </span>
                  <p className="sm:col-span-10 font-serif text-base sm:text-lg text-[#141413] leading-relaxed">
                    {item.question}
                  </p>
                </div>
              ))}
            </div>

            <p className="font-serif text-base text-[#3C3C38] leading-relaxed pt-3 max-w-3xl">
              Quantifying creativity does not mean converting creativity into monetary value. The inquiry concerns how creativity might be described, understood, compared, supported, and recognized without reducing its significance to economic incentives.
            </p>
          </div>

          {/* Research Intersections Index */}
          <div className="space-y-4 pt-2">
            <span className="text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider block">
              Research Intersections
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-t border-l border-[#E5E3DB]">
              {RESEARCH_INTERSECTIONS.map((field) => (
                <div
                  key={field.num}
                  className="p-3.5 border-r border-b border-[#E5E3DB] bg-[#FBFBFA] space-y-1"
                >
                  <span className="text-[10px] font-mono-archival text-[#9E2A2B] tabular-nums block">
                    {field.num}
                  </span>
                  <span className="font-serif text-sm sm:text-base text-[#141413] block">
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 04 — TECHNOLOGY AND THE HUMAN FUTURE */}
        <section id="about-technology" className="space-y-8 pb-12 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="pb-2 border-b border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
            04 • TECHNOLOGY AND THE HUMAN FUTURE
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium leading-snug max-w-2xl">
            My interest in technology is fundamentally humanistic.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 space-y-4 font-serif text-base sm:text-lg text-[#2C2C28] leading-relaxed">
              <p>
                I am interested in helping shape systems that expand human creativity, agency, curiosity, and connection rather than narrowing them.
              </p>
              <p>
                Technological progress is most compelling to me when it increases the range of ways people can think, make, relate, and participate in the world.
              </p>
              <p>
                This perspective also extends beyond strictly human-centered ideas of progress.
              </p>
              <p>
                I am interested in posthuman and regenerative frameworks that question assumptions of human superiority and instead consider technology, culture, ecology, and other forms of life as parts of an interdependent system.
              </p>
              <p>
                I am drawn to futures defined less by domination and extraction than by greater intelligence, abundance, reciprocity, and harmony.
              </p>
            </div>

            {/* Conceptual Interdependence Diagram */}
            <aside className="md:col-span-5 p-6 bg-[#F4F3EE] border border-[#E5E3DB] space-y-5">
              <div className="flex items-center justify-between text-[11px] font-mono-archival text-[#6E6E66] border-b border-[#E5E3DB] pb-2">
                <span>INTERDEPENDENT SYSTEM</span>
                <span className="text-[#9E2A2B]">SCHEMA</span>
              </div>

              <div className="py-2 flex justify-center">
                <svg
                  viewBox="0 0 320 220"
                  className="w-full max-w-[320px] h-auto"
                  role="img"
                  aria-label="Conceptual diagram relating Technology, Culture, Ecology, and Forms of Life as an interdependent system"
                >
                  {/* Harmonic connection ring */}
                  <circle
                    cx="160"
                    cy="110"
                    r="56"
                    fill="none"
                    stroke="#D5D3CB"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Orthogonal relational axes */}
                  <line x1="160" y1="54" x2="160" y2="166" stroke="#D5D3CB" strokeWidth="1" />
                  <line x1="104" y1="110" x2="216" y2="110" stroke="#D5D3CB" strokeWidth="1" />
                  {/* Central reciprocity ring */}
                  <circle cx="160" cy="110" r="13" fill="#FBFBFA" stroke="#9E2A2B" strokeWidth="1" />
                  <circle cx="160" cy="110" r="2.5" fill="#9E2A2B" />

                  {/* Four cardinal node points */}
                  <circle cx="160" cy="54" r="3.5" fill="#141413" />
                  <circle cx="216" cy="110" r="3.5" fill="#141413" />
                  <circle cx="160" cy="166" r="3.5" fill="#141413" />
                  <circle cx="104" cy="110" r="3.5" fill="#141413" />

                  {/* Labels */}
                  <text
                    x="160"
                    y="34"
                    textAnchor="middle"
                    fill="#141413"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.08em"
                  >
                    TECHNOLOGY
                  </text>
                  <text
                    x="228"
                    y="113"
                    textAnchor="start"
                    fill="#141413"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.08em"
                  >
                    CULTURE
                  </text>
                  <text
                    x="160"
                    y="192"
                    textAnchor="middle"
                    fill="#141413"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.08em"
                  >
                    ECOLOGY
                  </text>
                  <text
                    x="92"
                    y="113"
                    textAnchor="end"
                    fill="#141413"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.06em"
                  >
                    FORMS OF LIFE
                  </text>
                </svg>
              </div>

              <p className="font-serif text-xs sm:text-sm text-[#4A4A44] italic leading-relaxed border-t border-[#E5E3DB] pt-3">
                Technological and institutional systems considered alongside culture, ecology, and other forms of life through intelligence, abundance, reciprocity, and harmony.
              </p>
            </aside>
          </div>
        </section>

        {/* SECTION 05 — DIRECTION */}
        <section id="about-direction" className="space-y-8 pb-12 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="pb-2 border-b border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
            05 • DIRECTION
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#141413] font-medium leading-snug max-w-2xl">
            Over time, I imagine RUI becoming an ecosystem rather than simply an archive.
          </h2>

          <div className="space-y-4 font-serif text-base sm:text-lg text-[#2C2C28] leading-relaxed max-w-3xl">
            <p>
              I envision intimate creative events, workshops, and gatherings that bring together people interested in artistic practice, technological possibility, cultural inquiry, and the development of personal identity. These spaces could support the acquisition of artistic skill, the exchange of ideas, new collaborations, and a close creative community.
            </p>
            <p>
              I also imagine RUI developing into a research laboratory concerned with Chinese heritage and its contemporary reinterpretation, artistic experimentation, creative development, and new technologies for understanding creativity itself.
            </p>
            <p>
              That could include computational systems capable of identifying patterns in creative work, modeling creative processes, or developing new ways of describing and quantifying creative difference. RUI could collaborate with artists, researchers, technologists, institutions, and communities whose work expands these questions.
            </p>
          </div>

          {/* Three Interconnected Future Possibilities */}
          <div className="space-y-3 pt-2">
            <p className="font-serif text-sm text-[#5C5C54] italic">
              Interconnected areas that may emerge over time — not established divisions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DIRECTION_POSSIBILITIES.map((area) => (
                <div
                  key={area.title}
                  className="p-5 bg-[#FBFBFA] border border-dashed border-[#D5D3CB] space-y-2"
                >
                  <h3 className="font-serif text-lg text-[#141413] font-medium leading-snug">
                    {area.title}
                  </h3>
                  <p className="font-serif text-sm text-[#4A4A44] leading-relaxed">
                    {area.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 06 — ONGOING INQUIRY */}
        <section id="about-ongoing" className="space-y-7 pb-10 border-b border-[#E5E3DB] scroll-mt-24">
          <div className="text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
            06 • ONGOING INQUIRY
          </div>

          <div className="space-y-5 max-w-2xl">
            <p className="font-serif text-lg sm:text-xl text-[#141413] leading-relaxed">
              The long-term ambition is to understand creativity from both inside and outside of the act itself: to participate in creative practice while also helping build the cultural, technological, and institutional systems through which creativity can flourish.
            </p>
            <p className="font-serif text-lg sm:text-xl text-[#5C5C54] italic leading-relaxed">
              For now, this archive documents the inquiry while it is still becoming.
            </p>
          </div>

          {/* Archive Exploration Links */}
          {onNavigate && (
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-mono-archival">
              <button
                type="button"
                onClick={() => onNavigate({ page: 'home' })}
                className="inline-flex items-center space-x-2 py-2 text-[#141413] hover:text-[#9E2A2B] border-b border-[#141413] hover:border-[#9E2A2B] transition-colors"
              >
                <span>Explore Curated Works</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'laboratory' })}
                className="inline-flex items-center space-x-2 py-2 text-[#141413] hover:text-[#9E2A2B] border-b border-[#141413] hover:border-[#9E2A2B] transition-colors"
              >
                <span>Enter The Laboratory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'archive' })}
                className="inline-flex items-center space-x-2 py-2 text-[#6E6E66] hover:text-[#9E2A2B] border-b border-transparent hover:border-[#9E2A2B] transition-colors"
              >
                <span>Browse Archive Index</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Correspondence & Dispatch */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono-archival text-[#6E6E66] uppercase tracking-wider">
              CORRESPONDENCE &amp; DISPATCH
            </span>
            <h2 className="font-serif text-2xl text-[#141413] font-medium">
              Contact &amp; Transmissions
            </h2>
          </div>

          <div className="p-6 bg-[#F4F3EE] border border-[#E5E3DB]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono-archival">
              <div>
                <span className="block text-[#6E6E66] text-[10px] uppercase mb-1">Direct Inquiries</span>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-serif text-base text-[#141413] hover:text-[#9E2A2B] underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>

              <div>
                <span className="block text-[#6E6E66] text-[10px] uppercase mb-1">Studio Coordinates</span>
                <span className="font-serif text-base text-[#141413]">
                  {STUDIO_COORDINATES}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
