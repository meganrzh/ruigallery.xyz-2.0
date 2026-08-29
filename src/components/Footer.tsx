import React from 'react';
import { AppView } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#E5E3DB] bg-[#F4F3EE] py-12 text-[#141413]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#141413]">
                RUI
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#9E2A2B]" />
              <span className="font-chinese text-lg text-[#6E6E66] pl-1">睿</span>
              <span className="text-xs font-mono-archival text-[#8C8C82] pl-2 border-l border-[#D5D3CB]">
                ruigallery.xyz
              </span>
            </div>
            <p className="font-serif text-sm text-[#5C5C54] leading-relaxed max-w-sm">
              An ink-on-paper digital ecosystem unifying curated artistic works, an archival laboratory, and an integrated professional practice.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6 text-xs font-mono-archival text-left">
            <div className="space-y-2 text-left">
              <span className="text-[10px] text-[#8C8C82] uppercase tracking-wider block text-left">
                Archive Architecture
              </span>
              <ul className="space-y-1.5 text-left">
                <li className="text-left">
                  <button
                    id="footer-nav-curated-works"
                    onClick={() => onNavigate({ page: 'home' })}
                    className="text-left block text-[#4A4A44] hover:text-[#9E2A2B] hover:underline"
                  >
                    Curated Works
                  </button>
                </li>
                <li className="text-left">
                  <button
                    id="footer-nav-lab"
                    onClick={() => onNavigate({ page: 'laboratory' })}
                    className="text-left block text-[#4A4A44] hover:text-[#9E2A2B] hover:underline"
                  >
                    Laboratory Index
                  </button>
                </li>
                <li className="text-left">
                  <button
                    id="footer-nav-archive"
                    onClick={() => onNavigate({ page: 'archive' })}
                    className="text-left block text-[#4A4A44] hover:text-[#9E2A2B] hover:underline"
                  >
                    Archive Database
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[10px] text-[#8C8C82] uppercase tracking-wider block text-left">
                Context &amp; Studio
              </span>
              <ul className="space-y-1.5 text-left">
                <li className="text-left">
                  <button
                    id="footer-nav-about"
                    onClick={() => onNavigate({ page: 'about' })}
                    className="text-left block text-[#4A4A44] hover:text-[#9E2A2B] hover:underline"
                  >
                    About / Professional
                  </button>
                </li>
                <li className="text-left">
                  <button
                    id="footer-nav-admin"
                    onClick={() => onNavigate({ page: 'admin' })}
                    className="text-left flex items-center space-x-1 text-[#8C8C82] hover:text-[#9E2A2B]"
                  >
                    <span>CMS Administration</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Telemetry & Preservation Note */}
          <div className="md:col-span-3 space-y-2 text-xs font-mono-archival text-[#8C8C82]">
            <span className="text-[10px] text-[#8C8C82] uppercase tracking-wider block">
              Custody &amp; Telemetry
            </span>
            <p className="text-[11px] leading-relaxed">
              LAT 37.7749° N / LON 122.4194° W<br />
              FORMAT: Plaintext Archive Schema<br />
              VIEW: Independent Client Layer
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E3DB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-archival text-[#8C8C82]">
          <div>
            © {new Date().getFullYear()} RUI (睿). All creative rights preserved.
          </div>
          <div>
            Rigid Metadata • Flexible Content
          </div>
        </div>
      </div>
    </footer>
  );
};
