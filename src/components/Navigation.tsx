import React, { useState } from 'react';
import { Menu, X, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (page: string) => {
    return currentView.page === page;
  };

  const handleNav = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-xs border-b border-[#E5E3DB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Brand Mark */}
          <div className="flex items-center space-x-3">
            <button
              id="nav-brand-logo"
              onClick={() => handleNav({ page: 'home' })}
              className="group flex items-center space-x-2 text-left focus:outline-hidden"
            >
              <div className="relative flex items-center">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#141413] group-hover:text-[#9E2A2B] transition-colors">
                  RUI
                </span>
                {/* Visual red brand seal mark */}
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#9E2A2B] align-middle" />
              </div>
              <span className="font-chinese text-sm sm:text-base text-[#6E6E66] group-hover:text-[#9E2A2B] transition-colors pl-1">
                睿
              </span>
              <span className="hidden md:inline-block text-xs font-mono-archival text-[#8C8C82] pl-2 border-l border-[#E5E3DB]">
                ruigallery.xyz
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm">
            <button
              id="nav-work-btn"
              onClick={() => handleNav({ page: 'home' })}
              className={`font-serif tracking-wide transition-colors py-1 ${
                isActive('home') || isActive('work')
                  ? 'text-[#141413] font-medium border-b border-[#141413]'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              Work
            </button>

            <button
              id="nav-lab-btn"
              onClick={() => handleNav({ page: 'laboratory' })}
              className={`font-serif tracking-wide transition-colors py-1 ${
                isActive('laboratory') || isActive('collection') || isActive('study') || isActive('entry')
                  ? 'text-[#141413] font-medium border-b border-[#141413]'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              Laboratory
            </button>

            <button
              id="nav-archive-btn"
              onClick={() => handleNav({ page: 'archive' })}
              className={`font-serif tracking-wide transition-colors py-1 ${
                isActive('archive')
                  ? 'text-[#141413] font-medium border-b border-[#141413]'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              Archive Index
            </button>

            <button
              id="nav-about-btn"
              onClick={() => handleNav({ page: 'about' })}
              className={`font-serif tracking-wide transition-colors py-1 ${
                isActive('about')
                  ? 'text-[#141413] font-medium border-b border-[#141413]'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              About
            </button>

            {/* Subdued Admin Access */}
            <button
              id="nav-admin-btn"
              onClick={() => handleNav({ page: 'admin' })}
              className={`text-xs font-mono-archival px-2.5 py-1 transition-colors border ${
                isActive('admin')
                  ? 'border-[#9E2A2B] text-[#9E2A2B] bg-[#9E2A2B]/5 font-medium'
                  : 'border-[#E5E3DB] text-[#8C8C82] hover:text-[#141413] hover:border-[#141413]'
              }`}
              title="Content Management System"
            >
              <span className="flex items-center space-x-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>ADMIN</span>
              </span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 md:hidden">
            <button
              id="nav-mobile-admin-btn"
              onClick={() => handleNav({ page: 'admin' })}
              className="text-[11px] font-mono-archival px-2 py-0.5 border border-[#E5E3DB] text-[#8C8C82]"
            >
              CMS
            </button>
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#141413] hover:text-[#9E2A2B] focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E3DB] bg-[#FBFBFA] px-4 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleNav({ page: 'home' })}
              className={`text-left font-serif text-lg py-1 ${
                isActive('home') || isActive('work') ? 'text-[#9E2A2B] font-medium' : 'text-[#141413]'
              }`}
            >
              Work (Curated)
            </button>
            <button
              onClick={() => handleNav({ page: 'laboratory' })}
              className={`text-left font-serif text-lg py-1 ${
                isActive('laboratory') ? 'text-[#9E2A2B] font-medium' : 'text-[#141413]'
              }`}
            >
              Laboratory (Notebooks &amp; Studies)
            </button>
            <button
              onClick={() => handleNav({ page: 'archive' })}
              className={`text-left font-serif text-lg py-1 ${
                isActive('archive') ? 'text-[#9E2A2B] font-medium' : 'text-[#141413]'
              }`}
            >
              Archive Index (Database)
            </button>
            <button
              onClick={() => handleNav({ page: 'about' })}
              className={`text-left font-serif text-lg py-1 ${
                isActive('about') ? 'text-[#9E2A2B] font-medium' : 'text-[#141413]'
              }`}
            >
              About &amp; Professional
            </button>
            <div className="pt-3 border-t border-[#E5E3DB]">
              <button
                onClick={() => handleNav({ page: 'admin' })}
                className="flex items-center space-x-2 text-xs font-mono-archival text-[#9E2A2B] py-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Access Archive Administration (Mock CMS)</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
