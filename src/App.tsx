import React, { useState, useEffect } from 'react';
import { ArchiveProvider, useArchive } from './context/ArchiveContext';
import { AppView } from './types';
import { Navigation } from './components/Navigation';
import { RuiHero } from './components/RuiHero';
import { CuratedEditorialGrid } from './components/CuratedEditorialGrid';
import { CuratedWorkDetail } from './components/CuratedWorkDetail';
import { LaboratoryView } from './components/LaboratoryView';
import { CollectionDetail } from './components/CollectionDetail';
import { StudyDetail } from './components/StudyDetail';
import { EntryDetail } from './components/EntryDetail';
import { ArchiveIndexTable } from './components/ArchiveIndexTable';
import { AboutView } from './components/AboutView';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

function parseHash(hash: string): AppView {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean || clean === '') return { page: 'home' };

  const parts = clean.split('/');
  const section = parts[0];
  const slug = parts[1];

  switch (section) {
    case 'work':
      return slug ? { page: 'work', slug } : { page: 'home' };
    case 'laboratory':
      return { page: 'laboratory', filterThreadId: slug };
    case 'collection':
      return slug ? { page: 'collection', slug } : { page: 'laboratory' };
    case 'study':
      return slug ? { page: 'study', slug } : { page: 'laboratory' };
    case 'entry':
      return slug ? { page: 'entry', slug } : { page: 'laboratory' };
    case 'archive':
      return { page: 'archive', initialThread: slug };
    case 'about':
      return { page: 'about' };
    case 'admin':
      return { page: 'admin', subTab: slug as any };
    default:
      return { page: 'home' };
  }
}

function viewToHash(view: AppView): string {
  switch (view.page) {
    case 'home':
      return '#/';
    case 'work':
      return `#/work/${view.slug}`;
    case 'laboratory':
      return view.filterThreadId ? `#/laboratory/${view.filterThreadId}` : '#/laboratory';
    case 'collection':
      return `#/collection/${view.slug}`;
    case 'study':
      return `#/study/${view.slug}`;
    case 'entry':
      return `#/entry/${view.slug}`;
    case 'archive':
      return view.initialThread ? `#/archive/${view.initialThread}` : '#/archive';
    case 'about':
      return '#/about';
    case 'admin':
      return view.subTab ? `#/admin/${view.subTab}` : '#/admin';
    default:
      return '#/';
  }
}

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseHash(window.location.hash);
    }
    return { page: 'home' };
  });

  // Listen to hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    const newHash = viewToHash(view);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreWorks = () => {
    const section = document.getElementById('curated-works-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#141413]">
      {/* Global Minimalist Navigation */}
      <Navigation currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentView.page === 'home' && (
          <>
            <RuiHero onNavigate={handleNavigate} />
            <CuratedEditorialGrid onNavigate={handleNavigate} />
          </>
        )}

        {currentView.page === 'work' && (
          <CuratedWorkDetail slug={currentView.slug} onNavigate={handleNavigate} />
        )}

        {currentView.page === 'laboratory' && (
          <LaboratoryView onNavigate={handleNavigate} filterThreadId={currentView.filterThreadId} />
        )}

        {currentView.page === 'collection' && (
          <CollectionDetail slug={currentView.slug} onNavigate={handleNavigate} />
        )}

        {currentView.page === 'study' && (
          <StudyDetail slug={currentView.slug} onNavigate={handleNavigate} />
        )}

        {currentView.page === 'entry' && (
          <EntryDetail slug={currentView.slug} onNavigate={handleNavigate} />
        )}

        {currentView.page === 'archive' && (
          <ArchiveIndexTable
            onNavigate={handleNavigate}
            initialThread={currentView.initialThread}
            initialCollection={currentView.initialCollection}
          />
        )}

        {currentView.page === 'about' && (
          <AboutView />
        )}

        {currentView.page === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} subTab={currentView.subTab} />
        )}
      </main>

      {/* Global Archival Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ArchiveProvider>
      <MainApp />
    </ArchiveProvider>
  );
}
