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
  addEntry: (entry: Omit<Entry, 'id'>) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;

  addCuratedWork: (work: Omit<CuratedWork, 'id'>) => CuratedWork;
  updateCuratedWork: (id: string, updates: Partial<CuratedWork>) => void;
  deleteCuratedWork: (id: string) => void;

  addCollection: (col: Omit<Collection, 'id'>) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => void;

  addStudy: (std: Omit<Study, 'id'>) => Promise<Study>;
  updateStudy: (id: string, updates: Partial<Study>) => Promise<void>;
  deleteStudy: (id: string) => void;

  addThread: (thread: Omit<Thread, 'id'>) => Promise<Thread>;
  deleteThread: (id: string) => Promise<void>;

  updateAboutData: (updates: Partial<AboutData>) => void;
  resetToDefaultData: () => void;
  refetchFromPersistentStore: () => Promise<void>;
}

const STORAGE_KEYS = {
  COLLECTIONS: 'rui_archive_collections_v1',
  STUDIES: 'rui_archive_studies_v1',
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

  // Entries and Threads: Single source of truth is D1/API.
  // Initial fallback to hardcoded seed so there is no layout jump before the initial API fetch completes.
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);

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
      if (persistent) {
        if (persistent.collections && persistent.collections.length > 0) {
          setCollections(persistent.collections);
        }
        if (persistent.studies && persistent.studies.length > 0) {
          setStudies(persistent.studies);
        }
        if (persistent.threads && persistent.threads.length > 0) {
          setThreads(persistent.threads);
        }
        if (persistent.entries && persistent.entries.length > 0) {
          setEntries(persistent.entries);
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

  // Sync only Collections, Studies, and unmigrated entities to localStorage
  // NOTE: Entries and Threads are NOT persisted to localStorage. D1 is the sole source of truth.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(studies));
  }, [studies]);

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
  const addEntry = async (entryData: Omit<Entry, 'id'>): Promise<Entry> => {
    const created = await api.createEntry(entryData);
    setEntries((prev) => [created, ...prev]);
    return created;
  };

  const updateEntry = async (id: string, updates: Partial<Entry>): Promise<Entry> => {
    const updated = await api.updateEntry(id, updates);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const deleteEntry = async (id: string): Promise<void> => {
    await api.deleteEntry(id);
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

  const addThread = async (threadData: Omit<Thread, 'id'>): Promise<Thread> => {
    const created = await api.createThread(threadData);
    setThreads((prev) => [...prev, created]);
    return created;
  };

  const deleteThread = async (id: string): Promise<void> => {
    await api.deleteThread(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
  };

  const updateAboutData = (updates: Partial<AboutData>) => {
    setAboutData((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaultData = () => {
    setCuratedWorks(INITIAL_CURATED_WORKS);
    setProfessionalItems(INITIAL_PROFESSIONAL_ITEMS);
    setAboutData(INITIAL_ABOUT_DATA);
    localStorage.removeItem(STORAGE_KEYS.WORKS);
    localStorage.removeItem(STORAGE_KEYS.PROFESSIONAL);
    localStorage.removeItem(STORAGE_KEYS.ABOUT);
    refetchFromPersistentStore();
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
