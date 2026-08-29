import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AppView } from '../types';

interface RuiHeroProps {
  onNavigate: (view: AppView) => void;
  onExploreWork?: () => void;
}

// Authentic Chinese Calligraphy strokes for 睿 (Wisdom / Foresight / Rui)
// Modeled with traditional brush anatomy: tapered entries (feng), pressure bellies (dun),
// corner turns (zhe), hanging dew (chuilu), and flared swallow-tail sweeps (yanwei).
interface CalligraphicStroke {
  id: string;
  name: string;
  outlineD: string;
  maskD: string;
  maskWidth: number;
  duration: number;
  delay: number;
}

const CALLIGRAPHIC_STROKES: CalligraphicStroke[] = [
  // 1. Dian (点) - Top-left slant dot with tear-shaped ink weight
  {
    id: 'stroke-1-dian',
    name: 'Top Dian',
    outlineD: 'M 101,30 C 104,33 115,42 121,50 C 124,54 122,58 116,58 C 108,57 98,48 96,42 C 94,37 98,31 101,30 Z',
    maskD: 'M 98,28 Q 112,44 122,58',
    maskWidth: 26,
    duration: 0.32,
    delay: 0.08,
  },
  // 2. Heng (横) - Top horizontal bar with hidden entry and weighted right dun
  {
    id: 'stroke-2-heng',
    name: 'Top Heng',
    outlineD: 'M 68,64 C 64,63 60,67 63,70 C 67,73 78,70 95,68 C 122,66 148,65 162,68 C 170,70 176,73 177,69 C 178,65 174,60 166,59 C 145,58 112,60 84,61 C 74,62 69,63 68,64 Z',
    maskD: 'M 60,64 L 180,66',
    maskWidth: 24,
    duration: 0.42,
    delay: 0.32,
  },
  // 3. Shu (竖) - Central vertical piercing stroke with hanging-dew drop
  {
    id: 'stroke-3-shu',
    name: 'Central Shu',
    outlineD: 'M 116,33 C 119,30 124,31 126,35 C 127,42 125,58 125,72 C 124,80 122,88 119,89 C 117,89 116,84 115,74 C 114,60 114,44 116,33 Z',
    maskD: 'M 120,28 L 120,92',
    maskWidth: 22,
    duration: 0.36,
    delay: 0.62,
  },
  // 4. Pie (撇) - Left sweeping stroke with accelerated tapered finish
  {
    id: 'stroke-4-pie',
    name: 'Left Pie',
    outlineD: 'M 104,78 C 108,82 104,88 96,96 C 85,108 72,120 54,132 C 52,133 54,130 58,125 C 72,111 86,97 96,82 C 100,77 103,76 104,78 Z',
    maskD: 'M 106,76 Q 84,104 50,134',
    maskWidth: 26,
    duration: 0.44,
    delay: 0.88,
  },
  // 5. Na / Dian (捺/点) - Right slant dot with firm ink pool landing
  {
    id: 'stroke-5-na',
    name: 'Right Na Slant',
    outlineD: 'M 136,78 C 140,76 144,80 148,86 C 158,98 171,114 184,124 C 187,126 185,129 180,129 C 171,128 158,116 148,102 C 141,92 135,83 136,78 Z',
    maskD: 'M 134,74 Q 156,102 188,130',
    maskWidth: 26,
    duration: 0.42,
    delay: 1.18,
  },
  // 6. Heng (横) - Upper base connector bar
  {
    id: 'stroke-6-heng',
    name: 'Mid Heng Connector',
    outlineD: 'M 80,113 C 76,112 73,115 76,117 C 82,119 96,117 118,116 C 138,115 152,117 158,119 C 162,120 164,117 163,114 C 160,111 146,111 126,111 C 104,111 86,112 80,113 Z',
    maskD: 'M 72,114 L 168,114',
    maskWidth: 22,
    duration: 0.35,
    delay: 1.48,
  },
  // 7. Mu Left Shu (目 竖) - Eye radical left vertical spine
  {
    id: 'stroke-7-mu-shu',
    name: 'Mu Radical Left Shu',
    outlineD: 'M 80,138 C 84,136 88,139 88,144 C 88,162 87,188 87,212 C 87,218 84,220 80,219 C 77,217 78,206 78,188 C 78,164 78,146 80,138 Z',
    maskD: 'M 82,132 L 82,224',
    maskWidth: 24,
    duration: 0.42,
    delay: 1.74,
  },
  // 8. Mu Hengzhe (目 横折) - Eye radical top bar and right corner drop
  {
    id: 'stroke-8-mu-hengzhe',
    name: 'Mu Radical Hengzhe',
    outlineD: 'M 84,139 C 96,138 118,137 132,138 C 137,138 141,141 142,146 C 142,156 140,186 139,214 C 139,218 135,220 132,217 C 130,214 131,198 132,168 C 132,150 131,146 126,145 C 114,144 98,144 84,145 C 81,145 81,141 84,139 Z',
    maskD: 'M 80,140 L 138,140 L 138,224',
    maskWidth: 24,
    duration: 0.55,
    delay: 2.04,
  },
  // 9. Mu Inner Heng 1 (目 横) - First inner horizontal
  {
    id: 'stroke-9-mu-heng1',
    name: 'Mu Inner Heng 1',
    outlineD: 'M 85,165 C 98,164 118,164 134,166 C 136,166 136,168 133,168 C 120,168 102,168 85,168 C 82,168 82,166 85,165 Z',
    maskD: 'M 82,166 L 138,166',
    maskWidth: 18,
    duration: 0.22,
    delay: 2.46,
  },
  // 10. Mu Inner Heng 2 (目 横) - Second inner horizontal
  {
    id: 'stroke-10-mu-heng2',
    name: 'Mu Inner Heng 2',
    outlineD: 'M 85,188 C 98,187 118,187 134,189 C 136,189 136,191 133,191 C 120,191 102,191 85,191 C 82,191 82,189 85,188 Z',
    maskD: 'M 82,189 L 138,189',
    maskWidth: 18,
    duration: 0.22,
    delay: 2.62,
  },
  // 11. Mu Bottom Heng (目 横) - Base closing horizontal
  {
    id: 'stroke-11-mu-heng3',
    name: 'Mu Bottom Heng',
    outlineD: 'M 78,214 C 92,213 120,213 138,214 C 143,215 144,217 138,218 C 124,218 96,218 78,218 C 74,218 74,215 78,214 Z',
    maskD: 'M 74,216 L 144,216',
    maskWidth: 20,
    duration: 0.24,
    delay: 2.78,
  },
  // 12. You Hengpie (又 横撇) - Right radical horizontal turn to arcing left sweep
  {
    id: 'stroke-12-you-hengpie',
    name: 'You Radical Hengpie',
    outlineD: 'M 152,143 C 162,142 178,142 186,143 C 190,144 192,148 190,154 C 185,168 174,192 153,216 C 151,218 150,215 153,210 C 168,188 177,166 180,154 C 181,150 178,149 172,149 C 162,149 154,148 152,146 C 150,144 150,143 152,143 Z',
    maskD: 'M 148,144 L 189,144 Q 176,178 148,220',
    maskWidth: 26,
    duration: 0.52,
    delay: 2.96,
  },
  // 13. You Na (又 捺) - Grand rightward sweeping counter-balance with flared swallow tail
  {
    id: 'stroke-13-you-na',
    name: 'You Radical Na',
    outlineD: 'M 148,160 C 154,158 158,162 165,170 C 178,184 194,198 212,206 C 224,210 234,208 238,206 C 239,205 237,208 230,212 C 218,217 205,216 195,210 C 180,200 166,184 154,169 C 148,162 146,160 148,160 Z',
    maskD: 'M 144,158 Q 178,188 206,208 L 242,208',
    maskWidth: 32,
    duration: 0.58,
    delay: 3.34,
  },
];

export const RuiHero: React.FC<RuiHeroProps> = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative pt-8 pb-8 md:pt-14 md:pb-10 border-b border-[#E5E3DB] overflow-hidden">
      {/* Background fine grid watermark for archival alignment feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#141413_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Top metadata register */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82] pb-4 mb-4 border-b border-[#EFEFEA]">
            <div className="flex items-center space-x-3">
              <span className="text-[#9E2A2B] font-medium">[ ARCHIVE SYSTEM ]</span>
              <span>VOL. 01 / 2026</span>
              <span className="hidden sm:inline-block">SAN FRANCISCO &amp; LOS ANGELES</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>LOC: 37.7749° N, 122.4194° W</span>
              <span className="hidden md:inline-block text-[#141413]">STATUS: ACTIVE VIEW</span>
            </div>
          </div>

          {/* Master Hero Composition: RUI + 睿 Side-by-Side */}
          <div className="max-w-5xl">
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 md:gap-14 lg:gap-16">
              {/* Dominant RUI Typography */}
              <h1
                id="hero-main-title"
                className="font-bold leading-[0.85] tracking-tight text-[#141413] select-none text-[5rem] sm:text-[8rem] md:text-[10.5rem] lg:text-[200px]"
                style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '200px' }}
              >
                RUI
              </h1>

              {/* Single Authentic Calligraphic 睿 Character (Animated Brush Strokes) */}
              <div 
                id="hero-calligraphy-container"
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 flex-shrink-0 select-none pointer-events-none"
                aria-label="睿 Calligraphy"
              >
                <svg
                  viewBox="40 20 205 215"
                  className="w-full h-full overflow-visible"
                  style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(158, 42, 43, 0.18))' }}
                >
                  <defs>
                    {CALLIGRAPHIC_STROKES.map((stroke) => (
                      <mask key={`mask-${stroke.id}`} id={`mask-${stroke.id}`}>
                        {shouldReduceMotion ? (
                          <path
                            d={stroke.maskD}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={stroke.maskWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          <motion.path
                            d={stroke.maskD}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={stroke.maskWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{
                              duration: stroke.duration,
                              delay: stroke.delay,
                              ease: [0.25, 0.1, 0.25, 1.0], // authentic calligraphic ink velocity curve
                            }}
                          />
                        )}
                      </mask>
                    ))}
                  </defs>

                  {/* Render the 13 authentic calligraphic filled brush strokes with their animated masks */}
                  {CALLIGRAPHIC_STROKES.map((stroke) => (
                    <path
                      key={`path-${stroke.id}`}
                      d={stroke.outlineD}
                      fill="#9E2A2B"
                      mask={`url(#mask-${stroke.id})`}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Subtitle / Conceptual Framing */}
            <p
              id="hero-subtitle-framing"
              className="mt-4 md:mt-6 text-[#4A4A44] max-w-2xl leading-relaxed text-[20px]"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '20px' }}
            >
              A central digital environment uniting curated creative works, an exploratory research laboratory, and an integrated professional ecosystem.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

