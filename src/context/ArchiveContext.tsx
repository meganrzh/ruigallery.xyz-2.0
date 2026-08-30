import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Collection,
  Study,
  Entry,
  Thread,
  CuratedWork,
  ProfessionalItem,
  AboutData,
} from '../types';
import {
  INITIAL_COLLECTIONS,
  INITIAL_STUDIES,
  INITIAL_ENTRIES,
  INITIAL_THREADS,
  INITIAL_CURATED_WORKS,
  INITIAL_PROFESSIONAL_ITEMS,
  INITIAL_ABOUT_DATA,
} from '../data/initialData';
import { api } from '../services/api';

interface ArchiveContextType {
  collections: Collection[];
  studies: Study[];
  entries: Entry[];
  threads: Thread[];
  curatedWorks: CuratedWork[];
  professionalItems: ProfessionalItem[];
  aboutData: AboutData;
  isLoading: boolean;
  isPersistent: boolean;

  // Retrieval helpers
  getCollection: (idOrSlug: string) => Collection | undefined;
  getStudy: (idOrSlug: string) => Study | undefined;
  getEntry: (idOrSlug: string) => Entry | undefined;
  getCuratedWork: (idOrSlug: string) => CuratedWork | undefined;
  getThread: (idOrSlug: string) => Thread | undefined;
  getStudiesByCollection: (collectionId: string) => Study[];
  getEntriesByStudy: (studyId: string) => Entry[];
  getEntriesByCollection: (collectionId: string) => Entry[];
  getEntriesByThread: (threadId: string) => Entry[];
  getRelatedStudiesForEntry: (entry: Entry) => Study[];
  getRelatedEntriesForWork: (work: CuratedWork) => Entry[];
  getRelatedStudiesForWork: (work: CuratedWork) => Study[];
  getNextPrevEntry: (currentId: string) => { prev?: Entry; next?: Entry };
  getNextPrevWork: (currentId: string) => { prev?: CuratedWork; next?: CuratedWork };

  // Mutations for Admin
  addEntry: (entry: Omit<Entry, 'id'>) => Entry;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;

  addCuratedWork: (work: Omit<CuratedWork, 'id'>) => CuratedWork;
  updateCuratedWork: (id: string, updates: Partial<CuratedWork>) => void;
  deleteCuratedWork: (id: string) => void;

  addCollection: (col: Omit<Collection, 'id'>) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => void;

  addStudy: (std: Omit<Study, 'id'>) => Promise<Study>;
  updateStudy: (id: string, updates: Partial<Study>) => Promise<void>;
  deleteStudy: (id: string) => void;

  addThread: (thread: Omit<Thread, 'id'>) => Thread;
  deleteThread: (id: string) => void;

  updateAboutData: (updates: Partial<AboutData>) => void;
  resetToDefaultData: () => void;
  refetchFromPersistentStore: () => Promise<void>;
}

const STORAGE_KEYS = {
  COLLECTIONS: 'rui_archive_collections_v1',
  STUDIES: 'rui_archive_studies_v1',
  ENTRIES: 'rui_archive_entries_v1',
  THREADS: 'rui_archive_threads_v1',
  WORKS: 'rui_archive_works_v1',
  PROFESSIONAL: 'rui_archive_professional_v1',
  ABOUT: 'rui_archive_about_v1',
};

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

export const ArchiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPersistent, setIsPersistent] = useState(false);

  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
    } catch {
      return INITIAL_COLLECTIONS;
    }
  });

  const [studies, setStudies] = useState<Study[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDIES);
      return saved ? JSON.parse(saved) : INITIAL_STUDIES;
    } catch {
      return INITIAL_STUDIES;
    }
  });

  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch {
      return INITIAL_ENTRIES;
    }
  });

  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THREADS);
      return saved ? JSON.parse(saved) : INITIAL_THREADS;
    } catch {
      return INITIAL_THREADS;
    }
  });

  const [curatedWorks, setCuratedWorks] = useState<CuratedWork[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKS);
      return saved ? JSON.parse(saved) : INITIAL_CURATED_WORKS;
    } catch {
      return INITIAL_CURATED_WORKS;
    }
  });

  const [professionalItems, setProfessionalItems] = useState<ProfessionalItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFESSIONAL);
      return saved ? JSON.parse(saved) : INITIAL_PROFESSIONAL_ITEMS;
    } catch {
      return INITIAL_PROFESSIONAL_ITEMS;
    }
  });

  const [aboutData, setAboutData] = useState<AboutData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ABOUT);
      return saved ? JSON.parse(saved) : INITIAL_ABOUT_DATA;
    } catch {
      return INITIAL_ABOUT_DATA;
    }
  });

  // Initial persistent fetch from D1 / API
  const refetchFromPersistentStore = useCallback(async () => {
    try {
      setIsLoading(true);
      const persistent = await api.getArchive();
      if (persistent && persistent.collections.length > 0) {
        setCollections(persistent.collections);
        if (persistent.studies.length > 0) {
          setStudies(persistent.studies);
        }
        setIsPersistent(true);
      }
    } catch (err) {
      console.warn('[ArchiveContext] Note: Operating in local fallback mode', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchFromPersistentStore();
  }, [refetchFromPersistentStore]);

  // Sync to localStorage as temporary fallback during migration
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(studies));
  }, [studies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(curatedWorks));
  }, [curatedWorks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFESSIONAL, JSON.stringify(professionalItems));
  }, [professionalItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ABOUT, JSON.stringify(aboutData));
  }, [aboutData]);

  // Retrieval helpers
  const getCollection = (idOrSlug: string) => {
    return collections.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  };

  const getStudy = (idOrSlug: string) => {
    return studies.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  };

  const getEntry = (idOrSlug: string) => {
    return entries.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
  };

  const getCuratedWork = (idOrSlug: string) => {
    return curatedWorks.find((w) => w.id === idOrSlug || w.slug === idOrSlug);
  };

  const getThread = (idOrSlug: string) => {
    return threads.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
  };

  const getStudiesByCollection = (collectionId: string) => {
    return studies
      .filter((s) => s.collectionId === collectionId)
      .sort((a, b) => a.order - b.order);
  };

  const getEntriesByStudy = (studyId: string) => {
    return entries
      .filter((e) => e.studyId === studyId && e.visibility !== 'hidden')
      .sort((a, b) => new Date(b.createdDate.replace(/\./g, '-')).getTime() - new Date(a.createdDate.replace(/\./g, '-')).getTime());
  };

  const getEntriesByCollection = (collectionId: string) => {
    return entries
      .filter((e) => e.collectionId === collectionId && e.visibility !== 'hidden')
      .sort((a, b) => new Date(b.createdDate.replace(/\./g, '-')).getTime() - new Date(a.createdDate.replace(/\./g, '-')).getTime());
  };

  const getEntriesByThread = (threadId: string) => {
    return entries
      .filter((e) => e.threadIds.includes(threadId) && e.visibility !== 'hidden')
      .sort((a, b) => new Date(b.createdDate.replace(/\./g, '-')).getTime() - new Date(a.createdDate.replace(/\./g, '-')).getTime());
  };

  const getRelatedStudiesForEntry = (entry: Entry) => {
    if (!entry.relatedStudyIds || entry.relatedStudyIds.length === 0) return [];
    return studies.filter((s) => entry.relatedStudyIds?.includes(s.id));
  };

  const getRelatedEntriesForWork = (work: CuratedWork) => {
    if (!work.relatedEntryIds || work.relatedEntryIds.length === 0) return [];
    return entries.filter((e) => work.relatedEntryIds?.includes(e.id));
  };

  const getRelatedStudiesForWork = (work: CuratedWork) => {
    if (!work.relatedStudyIds || work.relatedStudyIds.length === 0) return [];
    return studies.filter((s) => work.relatedStudyIds?.includes(s.id));
  };

  const getNextPrevEntry = (currentId: string) => {
    const published = entries.filter((e) => e.visibility === 'published');
    const sorted = [...published].sort(
      (a, b) => new Date(b.createdDate.replace(/\./g, '-')).getTime() - new Date(a.createdDate.replace(/\./g, '-')).getTime()
    );
    const index = sorted.findIndex((e) => e.id === currentId || e.slug === currentId);
    if (index === -1) return {};
    return {
      prev: index > 0 ? sorted[index - 1] : undefined,
      next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
    };
  };

  const getNextPrevWork = (currentId: string) => {
    const published = curatedWorks.filter((w) => w.visibility === 'published');
    const index = published.findIndex((w) => w.id === currentId || w.slug === currentId);
    if (index === -1) return {};
    return {
      prev: index > 0 ? published[index - 1] : undefined,
      next: index < published.length - 1 ? published[index + 1] : undefined,
    };
  };

  // Mutations
  const addEntry = (entryData: Omit<Entry, 'id'>): Entry => {
    const newEntry: Entry = {
      ...entryData,
      id: `entry-${Date.now()}`,
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const updateEntry = (id: string, updates: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, lastModifiedDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.') } : e))
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addCuratedWork = (workData: Omit<CuratedWork, 'id'>): CuratedWork => {
    const newWork: CuratedWork = {
      ...workData,
      id: `work-${Date.now()}`,
    };
    setCuratedWorks((prev) => [newWork, ...prev]);
    return newWork;
  };

  const updateCuratedWork = (id: string, updates: Partial<CuratedWork>) => {
    setCuratedWorks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteCuratedWork = (id: string) => {
    setCuratedWorks((prev) => prev.filter((w) => w.id !== id));
  };

  const addCollection = async (colData: Omit<Collection, 'id'>): Promise<Collection> => {
    const tempId = `col-${Date.now()}`;
    const newCol: Collection = {
      ...colData,
      id: tempId,
    };
    try {
      const persisted = await api.createCollection(newCol);
      setCollections((prev) => [...prev, persisted]);
      return persisted;
    } catch {
      setCollections((prev) => [...prev, newCol]);
      return newCol;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>): Promise<void> => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await api.updateCollection(id, updates);
    } catch (err) {
      console.warn('[ArchiveContext] Update saved to local state/fallback only', err);
    }
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  const addStudy = async (stdData: Omit<Study, 'id'>): Promise<Study> => {
    const tempId = `std-${Date.now()}`;
    const newStd: Study = {
      ...stdData,
      id: tempId,
    };
    try {
      const persisted = await api.createStudy(newStd);
      setStudies((prev) => [...prev, persisted]);
      return persisted;
    } catch {
      setStudies((prev) => [...prev, newStd]);
      return newStd;
    }
  };

  const updateStudy = async (id: string, updates: Partial<Study>): Promise<void> => {
    setStudies((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    try {
      await api.updateStudy(id, updates);
    } catch (err) {
      console.warn('[ArchiveContext] Update saved to local state/fallback only', err);
    }
  };

  const deleteStudy = (id: string) => {
    setStudies((prev) => prev.filter((s) => s.id !== id));
  };

  const addThread = (threadData: Omit<Thread, 'id'>): Thread => {
    const newThread: Thread = {
      ...threadData,
      id: `thread-${Date.now()}`,
    };
    setThreads((prev) => [...prev, newThread]);
    return newThread;
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAboutData = (updates: Partial<AboutData>) => {
    setAboutData((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaultData = () => {
    setCollections(INITIAL_COLLECTIONS);
    setStudies(INITIAL_STUDIES);
    setEntries(INITIAL_ENTRIES);
    setThreads(INITIAL_THREADS);
    setCuratedWorks(INITIAL_CURATED_WORKS);
    setProfessionalItems(INITIAL_PROFESSIONAL_ITEMS);
    setAboutData(INITIAL_ABOUT_DATA);
    localStorage.clear();
  };

  return (
    <ArchiveContext.Provider
      value={{
        collections,
        studies,
        entries,
        threads,
        curatedWorks,
        professionalItems,
        aboutData,
        isLoading,
        isPersistent,
        getCollection,
        getStudy,
        getEntry,
        getCuratedWork,
        getThread,
        getStudiesByCollection,
        getEntriesByStudy,
        getEntriesByCollection,
        getEntriesByThread,
        getRelatedStudiesForEntry,
        getRelatedEntriesForWork,
        getRelatedStudiesForWork,
        getNextPrevEntry,
        getNextPrevWork,
        addEntry,
        updateEntry,
        deleteEntry,
        addCuratedWork,
        updateCuratedWork,
        deleteCuratedWork,
        addCollection,
        updateCollection,
        deleteCollection,
        addStudy,
        updateStudy,
        deleteStudy,
        addThread,
        deleteThread,
        updateAboutData,
        resetToDefaultData,
        refetchFromPersistentStore,
      }}
    >
      {children}
    </ArchiveContext.Provider>
  );
};

export const useArchive = () => {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return context;
};
