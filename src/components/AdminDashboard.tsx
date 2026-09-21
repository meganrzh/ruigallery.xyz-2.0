import React, { useState, useMemo, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  Edit2,
  Eye,
  CheckCircle,
  FileText,
  FolderPlus,
  BookOpen,
  Tag,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  X,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowUpDown,
} from 'lucide-react';
import {
  Entry,
  Collection,
  Study,
  Thread,
  EntryBlock,
  AppView,
  RuiRevision,
  INITIAL_ENTRY_MEDIUMS,
} from '../types';
import { useArchive } from '../context/ArchiveContext';
import { api } from '../services/api';
import { EntryEditor } from './EntryEditor';
import { EntryReaderPreview } from './EntryReaderPreview';

interface AdminDashboardProps {
  onNavigate: (view: AppView) => void;
  subTab?: 'entries' | 'homepage' | 'collections' | 'threads' | 'new-entry' | 'work' | 'new-work';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, subTab = 'entries' }) => {
  const {
    collections,
    studies,
    entries,
    threads,
    curatedWorks,
    addEntry,
    updateEntry,
    deleteEntry,
    addCollection,
    updateCollection,
    deleteCollection,
    reorderCollections,
    addStudy,
    updateStudy,
    addThread,
    deleteThread,
    resetToDefaultData,
  } = useArchive();

  // Resolve initial tab (aliasing legacy 'work' -> 'homepage', 'new-work' -> 'new-entry')
  const initialTab =
    subTab === 'work' ? 'homepage' : subTab === 'new-work' ? 'new-entry' : subTab || 'entries';

  const [activeTab, setActiveTab] = useState<'entries' | 'homepage' | 'collections' | 'threads' | 'new-entry'>(
    initialTab as any
  );

  // Return tab when saving or cancelling entry editing
  const [editorSourceTab, setEditorSourceTab] = useState<'entries' | 'homepage'>('entries');

  // Cloudflare Access Session Authentication State
  const [authState, setAuthState] = useState<{
    loading: boolean;
    authenticated: boolean;
    userEmail?: string;
  }>({ loading: true, authenticated: false });

  useEffect(() => {
    let isMounted = true;
    api.getSession()
      .then((session) => {
        if (!isMounted) return;
        if (session && session.authenticated) {
          setAuthState({
            loading: false,
            authenticated: true,
            userEmail: session.user?.email,
          });
        } else {
          setAuthState({
            loading: false,
            authenticated: false,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState({ loading: false, authenticated: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Unified Entry Authoring & Editing State
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [previewingEntry, setPreviewingEntry] = useState<Entry | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Archive Database Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedium, setFilterMedium] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'featured'>('all');

  // Homepage Curation subsets derived from unified entries
  const featuredEntries = useMemo(() => {
    return entries.filter((e) => Boolean(e.featuredOnHome));
  }, [entries]);

  const unfeaturedEntries = useMemo(() => {
    return entries.filter((e) => !e.featuredOnHome);
  }, [entries]);

  const allEntryMediums = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.medium).filter((m): m is string => Boolean(m && m.trim()))));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filterStatus === 'published' && entry.visibility !== 'published') return false;
      if (filterStatus === 'draft' && entry.visibility !== 'draft') return false;
      if (filterStatus === 'featured' && !entry.featuredOnHome) return false;
      if (filterMedium !== 'all' && entry.medium !== filterMedium) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesSlug = entry.slug.toLowerCase().includes(query);
        const matchesNumber = (entry.entryNumber || '').toLowerCase().includes(query);
        const matchesMedium = (entry.medium || '').toLowerCase().includes(query);
        const matchesExcerpt = (entry.excerpt || entry.summary || '').toLowerCase().includes(query);
        return matchesTitle || matchesSlug || matchesNumber || matchesMedium || matchesExcerpt;
      }
      return true;
    });
  }, [entries, filterStatus, filterMedium, searchTerm]);

  // New Collection Form State
  const [newColTitle, setNewColTitle] = useState('');
  const [newColSubtitle, setNewColSubtitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColPeriod, setNewColPeriod] = useState('2026 — Present');

  // New Study Form State
  const [newStdTitle, setNewStdTitle] = useState('');
  const [newStdSubtitle, setNewStdSubtitle] = useState('');
  const [newStdDesc, setNewStdDesc] = useState('');
  const [newStdColId, setNewStdColId] = useState(collections[0]?.id || '');
  const [newStdThreads, setNewStdThreads] = useState<string[]>([]);

  // New Thread State
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadDesc, setNewThreadDesc] = useState('');

  // Collections sorted strictly by explicit showcase display order
  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [collections]);

  // Drag and Drop reordering state
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  // Editing existing Collection State
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [editColSubtitle, setEditColSubtitle] = useState('');
  const [editColDesc, setEditColDesc] = useState('');
  const [editColPeriod, setEditColPeriod] = useState('');
  const [isSavingCol, setIsSavingCol] = useState(false);

  // Editing existing Study State
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [editStudyTitle, setEditStudyTitle] = useState('');
  const [editStudySubtitle, setEditStudySubtitle] = useState('');
  const [editStudyDesc, setEditStudyDesc] = useState('');
  const [editStudyColId, setEditStudyColId] = useState('');
  const [isSavingStudy, setIsSavingStudy] = useState(false);

  const startEditCollection = (col: (typeof collections)[0]) => {
    setEditingColId(col.id);
    setEditColTitle(col.title);
    setEditColSubtitle(col.subtitle || '');
    setEditColDesc(col.description);
    setEditColPeriod(col.period);
  };

  const handleSaveCollectionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColId || !editColTitle) return;
    setIsSavingCol(true);
    try {
      await updateCollection(editingColId, {
        title: editColTitle,
        subtitle: editColSubtitle,
        description: editColDesc,
        period: editColPeriod,
      });
      setSuccessMessage(`Collection "${editColTitle}" updated and persisted!`);
      setEditingColId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save collection: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingCol(false);
    }
  };

  // Reorder Collection Handlers
  const handleMoveCollection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCollections.length) return;

    const newOrder = [...sortedCollections];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    await reorderCollections(newOrder);
    setSuccessMessage(`Moved "${moved.title}" to showcase position #${targetIndex + 1}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === dropIndex) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }

    const newOrder = [...sortedCollections];
    const [moved] = newOrder.splice(draggedColIndex, 1);
    newOrder.splice(dropIndex, 0, moved);

    setDraggedColIndex(null);
    setDragOverColIndex(null);

    await reorderCollections(newOrder);
    setSuccessMessage(`Moved "${moved.title}" to showcase position #${dropIndex + 1}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const startEditStudy = (std: (typeof studies)[0]) => {
    setEditingStudyId(std.id);
    setEditStudyTitle(std.title);
    setEditStudySubtitle(std.subtitle || '');
    setEditStudyDesc(std.description);
    setEditStudyColId(std.collectionId);
  };

  const handleSaveStudyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudyId || !editStudyTitle) return;
    setIsSavingStudy(true);
    try {
      await updateStudy(editingStudyId, {
        title: editStudyTitle,
        subtitle: editStudySubtitle,
        description: editStudyDesc,
        collectionId: editStudyColId,
      });
      setSuccessMessage(`Study "${editStudyTitle}" updated and persisted!`);
      setEditingStudyId(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save study: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingStudy(false);
    }
  };

  // Handle Add Collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle) return;
    const slug = newColTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addCollection({
      slug,
      title: newColTitle,
      subtitle: newColSubtitle,
      description: newColDesc,
      period: newColPeriod,
    });
    setNewColTitle('');
    setNewColSubtitle('');
    setNewColDesc('');
    setSuccessMessage(`Collection "${newColTitle}" created!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Add Study
  const handleCreateStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdTitle) return;
    const slug = newStdTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addStudy({
      slug,
      collectionId: newStdColId,
      title: newStdTitle,
      subtitle: newStdSubtitle,
      description: newStdDesc,
      createdDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      threadIds: newStdThreads,
      order: studies.length + 1,
    });
    setNewStdTitle('');
    setNewStdSubtitle('');
    setNewStdDesc('');
    setSuccessMessage(`Study "${newStdTitle}" registered!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Add Thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadName.trim()) return;
    const slug = newThreadName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      await addThread({
        slug,
        name: newThreadName.trim(),
        description: newThreadDesc.trim() || undefined,
      });
      setNewThreadName('');
      setNewThreadDesc('');
      setSuccessMessage(`Thread "#${newThreadName}" created!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating thread';
      setErrorMessage(`Failed to create thread: ${msg}`);
    }
  };

  // Export JSON
  const handleExportData = () => {
    const payload = {
      collections,
      studies,
      entries,
      threads,
      curatedWorks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rui_archive_backup_${Date.now()}.json`;
    a.click();
  };

  if (authState.loading) {
    return (
      <div className="py-24 animate-fade-in text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="inline-flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-widest uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-[#9E2A2B] animate-pulse" />
            <span>Verifying Access Assertion</span>
          </div>
          <p className="font-serif text-sm text-[#6B6960] italic">
            Connecting to RUI Archive security perimeter...
          </p>
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="py-16 md:py-24 animate-fade-in">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFFFFF] border border-[#E5E3DB] p-8 sm:p-10 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-widest uppercase">
                <span className="text-[#9E2A2B] font-semibold">[ RUI ARCHIVE ]</span>
                <span>•</span>
                <span>RESTRICTED ACCESS</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#141413]">
                Administrative Authentication Required
              </h1>
            </div>

            <p className="text-sm text-[#4A4940] leading-relaxed font-serif">
              Direct curation of the catalog, revisions, and modifications to Cloudflare D1 are restricted to the authorized administrator. Public read-only access remains active across the gallery.
            </p>

            <div className="p-4 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#6B6960] space-y-1.5">
              <div className="flex items-center space-x-2 text-[#141413] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B]" />
                <span>Zero Trust Perimeter Guard</span>
              </div>
              <p className="pl-3.5 leading-relaxed">
                All database mutations are sealed under <code className="text-[#141413]">/api/admin/*</code> and require a cryptographically verified Cloudflare Access token.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  window.location.href = `/api/admin/session?redirect=${encodeURIComponent(window.location.href)}`;
                }}
                className="px-6 py-3 bg-[#141413] hover:bg-[#2C2C28] text-[#FBFBFA] text-xs font-mono-archival tracking-wider uppercase transition-colors inline-flex items-center justify-center space-x-2"
              >
                <span>Authenticate with Cloudflare Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate({ page: 'home' })}
                className="px-5 py-3 bg-transparent hover:bg-[#F4F3EE] text-[#4A4940] border border-[#E5E3DB] text-xs font-mono-archival tracking-wider uppercase transition-colors"
              >
                Return to Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="p-6 bg-[#141413] text-[#FBFBFA] border border-[#141413] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82]">
                <span className="text-[#9E2A2B] font-semibold">[ RUI CMS LAYER ]</span>
                <span>•</span>
                <span className="text-emerald-400">AUTHENTICATED: {authState.userEmail || 'ADMINISTRATOR'}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium mt-1">
                Archive Content Management
              </h1>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono-archival">
              <button
                onClick={() => onNavigate({ page: 'home' })}
                className="px-3 py-1.5 bg-[#2C2C28] hover:bg-[#3C3C38] text-[#FBFBFA] border border-[#4A4A44] transition-colors"
              >
                Return to Live Site
              </button>
              <button
                onClick={resetToDefaultData}
                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800 transition-colors flex items-center space-x-1"
                title="Reset local storage back to default curated archive"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#333330] text-xs font-mono-archival">
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block uppercase">Archive Database</span>
              <span className="text-lg font-serif">{entries.length} Entries</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block uppercase">Homepage Curation</span>
              <span className="text-lg font-serif">{featuredEntries.length} Featured</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block uppercase">Studies</span>
              <span className="text-lg font-serif">{studies.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block uppercase">Collections</span>
              <span className="text-lg font-serif">{collections.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block uppercase">Threads</span>
              <span className="text-lg font-serif">{threads.length}</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono-archival flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-950/20 border border-red-800 text-red-200 text-xs font-mono-archival flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E3DB] pb-3 text-xs font-mono-archival">
          {/* Tab 1: Author New Entry (The ONLY authoring interface) */}
          <button
            onClick={() => {
              setEditingEntry(null);
              setEditorSourceTab('entries');
              setActiveTab('new-entry');
            }}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'new-entry'
                ? 'bg-[#9E2A2B] text-[#FBFBFA] border-[#9E2A2B] font-medium'
                : 'bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/30 hover:bg-[#9E2A2B]/20'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingEntry && activeTab === 'new-entry' ? `Editing ENTRY ${editingEntry.entryNumber}` : '+ Author New Entry'}</span>
          </button>

          {/* Tab 2: Archive Database */}
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'entries'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Archive Database ({entries.length})</span>
          </button>

          {/* Tab 3: Homepage Curation */}
          <button
            onClick={() => setActiveTab('homepage')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'homepage'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Homepage Curation ({featuredEntries.length})</span>
          </button>

          {/* Tab 4: Collections & Studies */}
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'collections'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Collections &amp; Studies ({collections.length})</span>
          </button>

          {/* Tab 5: Threads */}
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'threads'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Threads ({threads.length})</span>
          </button>
        </div>

        {/* Tab 1: Archive Database */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-[#141413] font-medium">
                  Archive Database ({entries.length})
                </h2>
                <p className="text-xs font-mono-archival text-[#8C8C82] mt-0.5">
                  Master management view for all cataloged entries across all mediums. Open any entry to edit in the unified EntryEditor.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setEditorSourceTab('entries');
                  setActiveTab('new-entry');
                }}
                className="text-xs font-mono-archival px-4 py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Author New Entry</span>
              </button>
            </div>

            {/* Search & Filter Controls */}
            <div className="p-4 bg-[#FBFBFA] border border-[#E5E3DB] flex flex-wrap items-center gap-3 text-xs font-mono-archival">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Filter entries by title, medium, slug, #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E3DB] text-[#141413] placeholder-[#8C8C82] focus:border-[#141413] outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[#8C8C82] text-[10px] uppercase">Medium:</span>
                <select
                  value={filterMedium}
                  onChange={(e) => setFilterMedium(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-[#E5E3DB] text-[#141413] outline-hidden cursor-pointer"
                >
                  <option value="all">All Mediums ({entries.length})</option>
                  {allEntryMediums.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[#8C8C82] text-[10px] uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2 py-1.5 bg-white border border-[#E5E3DB] text-[#141413] outline-hidden cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="featured">Homepage Featured ({featuredEntries.length})</option>
                </select>
              </div>

              {(searchTerm || filterMedium !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMedium('all');
                    setFilterStatus('all');
                  }}
                  className="text-[11px] text-[#9E2A2B] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="border border-[#E5E3DB] bg-[#FBFBFA] divide-y divide-[#E5E3DB]">
              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono-archival text-[#8C8C82]">
                  No entries matching the selected filters.
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[#F4F3EE] transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-archival text-[#8C8C82]">
                        <span className="text-[#141413] font-semibold">{entry.createdDate}</span>
                        <span>•</span>
                        <span className="text-[#9E2A2B] font-semibold">ENTRY {entry.entryNumber}</span>
                        {entry.ruiRevision ? (
                          <span className="px-1 py-0.2 bg-[#EAE8E0] text-[#9E2A2B] font-medium">{entry.ruiRevision}</span>
                        ) : (
                          <span className="px-1 py-0.2 bg-[#EFEFEA] text-[#8C8C82] text-[10px]">NO REV</span>
                        )}
                        {entry.medium && (
                          <span className="px-1.5 py-0.2 bg-[#EFEFEA] border border-[#E5E3DB] text-[#141413] text-[10px] font-medium">
                            {entry.medium}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.2 text-[10px] ${
                            entry.visibility === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {entry.visibility.toUpperCase()}
                        </span>
                        {entry.featuredOnHome && (
                          <span className="px-1.5 py-0.2 bg-[#141413] text-[#FBFBFA] text-[10px] font-medium flex items-center space-x-1">
                            <span>HOMEPAGE</span>
                            <span className="text-[#8C8C82]">[{entry.homeLayoutWeight || 'standard'}]</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base text-[#141413] font-medium truncate">
                        {entry.title}
                      </h3>
                      {entry.subtitle && (
                        <p className="font-serif text-xs text-[#6E6E66] italic line-clamp-1">
                          {entry.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono-archival shrink-0">
                      <button
                        onClick={() => setPreviewingEntry(entry)}
                        className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1 transition-colors"
                        title="Reader Preview Modal"
                      >
                        <Eye className="w-3 h-3 text-[#9E2A2B]" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                        className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1 transition-colors"
                        title="Open Public Entry Page"
                      >
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setEditorSourceTab('entries');
                          setActiveTab('new-entry');
                        }}
                        className="px-2.5 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] border border-[#141413] hover:border-[#9E2A2B] flex items-center space-x-1 transition-colors"
                        title="Edit Entry in Unified Editor"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Entry</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await updateEntry(entry.id, { featuredOnHome: !entry.featuredOnHome });
                            setSuccessMessage(`Entry "${entry.title}" ${!entry.featuredOnHome ? 'featured on' : 'removed from'} home.`);
                            setTimeout(() => setSuccessMessage(null), 3000);
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Error updating entry';
                            setErrorMessage(`Failed to update homepage featuring: ${msg}`);
                          }
                        }}
                        className={`px-2.5 py-1 border transition-colors ${
                          entry.featuredOnHome
                            ? 'bg-[#EAE8E0] text-[#141413] border-[#141413] font-medium'
                            : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB] hover:border-[#141413]'
                        }`}
                        title="Toggle Homepage Featuring"
                      >
                        {entry.featuredOnHome ? 'Featured (Home)' : 'Feature on Home'}
                      </button>
                      <button
                        onClick={async () => {
                          const newVis = entry.visibility === 'published' ? 'draft' : 'published';
                          try {
                            await updateEntry(entry.id, { visibility: newVis });
                            setSuccessMessage(`Entry visibility updated to ${newVis}.`);
                            setTimeout(() => setSuccessMessage(null), 3000);
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Error updating entry';
                            setErrorMessage(`Failed to update entry visibility: ${msg}`);
                          }
                        }}
                        className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#6E6E66]"
                      >
                        {entry.visibility === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete entry "${entry.title}"?`)) {
                            try {
                              await deleteEntry(entry.id);
                              setSuccessMessage(`Entry "${entry.title}" deleted.`);
                              setTimeout(() => setSuccessMessage(null), 3000);
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Error deleting entry';
                              setErrorMessage(`Failed to delete entry: ${msg}`);
                            }
                          }
                        }}
                        className="p-1 text-[#8C8C82] hover:text-red-700"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Author / Edit Entry (Unified CMS) */}
        {activeTab === 'new-entry' && (
          <EntryEditor
            key={editingEntry ? editingEntry.id : 'new-entry'}
            initialEntry={editingEntry}
            entries={entries}
            collections={collections}
            studies={studies}
            threads={threads}
            onSave={async (entryData, existingId) => {
              if (existingId) {
                await updateEntry(existingId, entryData);
                setSuccessMessage(`Entry "${entryData.title}" updated successfully in D1!`);
              } else {
                await addEntry(entryData);
                setSuccessMessage(`Entry "${entryData.title}" created successfully in D1!`);
              }
              setTimeout(() => setSuccessMessage(null), 4000);
              setEditingEntry(null);
              setActiveTab(editorSourceTab);
            }}
            onCancel={() => {
              setEditingEntry(null);
              setActiveTab(editorSourceTab);
            }}
          />
        )}

        {/* Tab 3: Homepage Curation */}
        {activeTab === 'homepage' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl text-[#141413] font-medium">
                  Homepage Curation ({featuredEntries.length})
                </h2>
                <p className="text-xs font-mono-archival text-[#8C8C82] mt-0.5">
                  Selected entries presented on the live homepage. Configure presentation weights and curation below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate({ page: 'home' })}
                  className="px-3 py-1.5 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#141413] text-xs font-mono-archival flex items-center space-x-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Live Homepage</span>
                </button>

                {unfeaturedEntries.length > 0 && (
                  <select
                    onChange={async (e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const target = entries.find((x) => x.id === id);
                      if (!target) return;
                      try {
                        await updateEntry(target.id, { featuredOnHome: true });
                        setSuccessMessage(`Entry "${target.title}" featured on Homepage.`);
                        setTimeout(() => setSuccessMessage(null), 3000);
                        e.target.value = '';
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Error featuring entry';
                        setErrorMessage(`Failed to feature entry: ${msg}`);
                      }
                    }}
                    defaultValue=""
                    className="px-3 py-1.5 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-xs font-mono-archival text-[#141413] outline-hidden cursor-pointer"
                  >
                    <option value="" disabled>
                      + Feature Entry from Archive ({unfeaturedEntries.length} available)...
                    </option>
                    {unfeaturedEntries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.entryNumber} — {e.title} ({e.medium || 'Visual Work'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {featuredEntries.length === 0 ? (
              <div className="p-12 text-center border border-[#E5E3DB] bg-[#FBFBFA] space-y-3">
                <Layers className="w-8 h-8 text-[#8C8C82] mx-auto" />
                <h3 className="font-serif text-lg text-[#141413]">No Entries Featured on Homepage</h3>
                <p className="text-xs font-mono-archival text-[#8C8C82] max-w-md mx-auto">
                  Entries are selected for the homepage through the unified Archive Database. Browse the Archive Database and click "Feature on Home" on any entry to curate it here.
                </p>
                <button
                  onClick={() => setActiveTab('entries')}
                  className="mt-2 px-4 py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] text-xs font-mono-archival transition-colors inline-flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Archive Database</span>
                </button>
              </div>
            ) : (
              <div className="border border-[#E5E3DB] bg-[#FBFBFA] divide-y divide-[#E5E3DB]">
                {featuredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F4F3EE] transition-colors"
                  >
                    <div className="flex items-start space-x-4 min-w-0">
                      {entry.coverImage ? (
                        <img
                          src={entry.coverImage}
                          alt={entry.coverImageAlt || entry.title}
                          className="w-24 h-24 object-cover border border-[#E5E3DB] shrink-0 bg-[#EAE8E0]"
                        />
                      ) : (
                        <div className="w-24 h-24 border border-[#E5E3DB] bg-[#EAE8E0] shrink-0 flex flex-col items-center justify-center text-[#8C8C82] p-2 text-center">
                          <FileText className="w-6 h-6 mb-1 text-[#8C8C82]" />
                          <span className="text-[9px] font-mono-archival">NO COVER</span>
                        </div>
                      )}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-archival text-[#8C8C82]">
                          <span className="text-[#9E2A2B] font-semibold">ENTRY {entry.entryNumber}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-[#EFEFEA] border border-[#E5E3DB] text-[#141413] text-[10px] font-medium">
                            {entry.medium || 'Visual Work'}
                          </span>
                          <span>•</span>
                          <span>{entry.displayDate || entry.createdDate}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] ${
                              entry.visibility === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {entry.visibility.toUpperCase()}
                          </span>
                          <span className="px-1.5 py-0.2 bg-[#141413] text-[#FBFBFA] text-[10px] font-medium uppercase">
                            {entry.homeLayoutWeight || 'standard'}
                          </span>
                        </div>

                        <h3 className="font-serif text-lg text-[#141413] font-medium truncate">
                          {entry.title}
                        </h3>

                        {entry.subtitle && (
                          <p className="font-serif text-xs text-[#6E6E66] italic line-clamp-1">
                            {entry.subtitle}
                          </p>
                        )}

                        <p className="font-serif text-xs text-[#5C5C54] line-clamp-2 max-w-2xl">
                          {entry.excerpt || entry.summary || 'No excerpt available.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-archival text-[#8C8C82] pt-1">
                          <span>{entry.blocks?.length || 0} Body Blocks</span>
                          <span>•</span>
                          <span>{entry.relatedStudyIds?.length || 0} Studies</span>
                          <span>•</span>
                          <span>{entry.relatedEntryIds?.length || 0} Related Entries</span>
                          <span>•</span>
                          <span>slug: /entry/{entry.slug}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono-archival shrink-0 pt-2 lg:pt-0">
                      {/* Home Layout Weight Selector */}
                      <div className="flex items-center space-x-1.5 bg-[#FBFBFA] border border-[#E5E3DB] px-2 py-1">
                        <span className="text-[10px] text-[#8C8C82] uppercase">Weight:</span>
                        <select
                          value={entry.homeLayoutWeight || 'standard'}
                          onChange={async (e) => {
                            const newWeight = e.target.value as Entry['homeLayoutWeight'];
                            try {
                              await updateEntry(entry.id, { homeLayoutWeight: newWeight });
                              setSuccessMessage(`Layout weight for "${entry.title}" set to ${newWeight}.`);
                              setTimeout(() => setSuccessMessage(null), 3000);
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Error updating weight';
                              setErrorMessage(`Failed to update layout weight: ${msg}`);
                            }
                          }}
                          className="bg-transparent text-xs font-mono-archival text-[#141413] focus:outline-hidden cursor-pointer"
                        >
                          <option value="standard">Standard (1 Col)</option>
                          <option value="dominant">Dominant (2 Col)</option>
                          <option value="horizontal-wide">Horizontal Wide</option>
                          <option value="editorial-compact">Editorial Compact</option>
                        </select>
                      </div>

                      {/* Reader Preview Modal */}
                      <button
                        onClick={() => setPreviewingEntry(entry)}
                        className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1 transition-colors"
                        title="Open Reader Preview Modal"
                      >
                        <Eye className="w-3 h-3 text-[#9E2A2B]" />
                        <span>Preview</span>
                      </button>

                      {/* Live Entry Page */}
                      <button
                        onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                        className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-[#141413] text-[#6E6E66] transition-colors"
                        title="Open Live Public Entry Page"
                      >
                        Live Entry
                      </button>

                      {/* Remove from Homepage */}
                      <button
                        onClick={async () => {
                          try {
                            await updateEntry(entry.id, { featuredOnHome: false });
                            setSuccessMessage(`Removed "${entry.title}" from Homepage.`);
                            setTimeout(() => setSuccessMessage(null), 3000);
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Error updating entry';
                            setErrorMessage(`Failed to remove entry from homepage: ${msg}`);
                          }
                        }}
                        className="px-2.5 py-1 bg-white border border-[#E5E3DB] hover:border-red-600 hover:text-red-700 text-[#6E6E66] transition-colors"
                        title="Remove from Homepage"
                      >
                        Remove from Home
                      </button>

                      {/* Edit Entry in unified EntryEditor */}
                      <button
                        onClick={() => {
                          setEditingEntry(entry);
                          setEditorSourceTab('homepage');
                          setActiveTab('new-entry');
                        }}
                        className="px-2.5 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] border border-[#141413] hover:border-[#9E2A2B] transition-colors flex items-center space-x-1"
                        title="Edit Entry in Unified Editor"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Entry</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Tab 4: Collections & Studies */}
        {activeTab === 'collections' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Collection */}
              <form onSubmit={handleCreateCollection} className="p-6 bg-[#F4F3EE] border border-[#E5E3DB] space-y-4">
                <h3 className="font-serif text-lg text-[#141413] font-medium pb-2 border-b border-[#E5E3DB]">
                  Add New Collection
                </h3>
                <div className="space-y-3 text-xs font-mono-archival">
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      placeholder="e.g. Kyoto Cartography Studies"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={newColSubtitle}
                      onChange={(e) => setNewColSubtitle(e.target.value)}
                      placeholder="Brief conceptual subtitle"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Period</label>
                    <input
                      type="text"
                      value={newColPeriod}
                      onChange={(e) => setNewColPeriod(e.target.value)}
                      placeholder="2026 — Present"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      placeholder="Description of the inquiry..."
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] uppercase tracking-wider font-semibold"
                  >
                    Create Collection
                  </button>
                </div>
              </form>

              {/* Create Study */}
              <form onSubmit={handleCreateStudy} className="p-6 bg-[#F4F3EE] border border-[#E5E3DB] space-y-4">
                <h3 className="font-serif text-lg text-[#141413] font-medium pb-2 border-b border-[#E5E3DB]">
                  Add Study to Collection
                </h3>
                <div className="space-y-3 text-xs font-mono-archival">
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Parent Collection *</label>
                    <select
                      value={newStdColId}
                      onChange={(e) => setNewStdColId(e.target.value)}
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    >
                      {sortedCollections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Study Title *</label>
                    <input
                      type="text"
                      required
                      value={newStdTitle}
                      onChange={(e) => setNewStdTitle(e.target.value)}
                      placeholder="e.g. Vernacular Roof Typologies"
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Study Description</label>
                    <textarea
                      rows={3}
                      value={newStdDesc}
                      onChange={(e) => setNewStdDesc(e.target.value)}
                      placeholder="Research focus..."
                      className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] uppercase tracking-wider font-semibold"
                  >
                    Create Study
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Collections & Studies Interactive Management */}
            <div className="space-y-6">
              <div className="pb-3 border-b border-[#E5E3DB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-serif text-xl text-[#141413] font-medium">
                    Manage Existing Hierarchy & Studies
                  </h3>
                  <p className="text-xs font-mono-archival text-[#8C8C82] mt-0.5">
                    Order defined here controls the exact showcase display sequence on the public Laboratory page.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] bg-[#F4F3EE] px-3 py-1.5 border border-[#E5E3DB]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  <span>Drag cards or use ▲ / ▼ to reorder</span>
                </div>
              </div>

              <div className="space-y-6">
                {sortedCollections.map((collection, index) => {
                  const collectionStudies = studies.filter((s) => s.collectionId === collection.id);
                  const isEditingCol = editingColId === collection.id;
                  const isDraggingOver = dragOverColIndex === index;

                  return (
                    <div
                      key={collection.id}
                      draggable={!editingColId}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`border bg-[#FBFBFA] p-6 space-y-4 transition-all ${
                        isDraggingOver
                          ? 'border-[#9E2A2B] ring-2 ring-[#9E2A2B]/20 bg-[#F4F3EE]'
                          : 'border-[#E5E3DB]'
                      }`}
                    >
                      {/* Collection Header */}
                      {isEditingCol ? (
                        <form onSubmit={handleSaveCollectionEdit} className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-3 text-xs font-mono-archival">
                          <span className="font-semibold text-xs text-[#9E2A2B]">EDIT COLLECTION: {collection.id}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Title</label>
                              <input
                                type="text"
                                required
                                value={editColTitle}
                                onChange={(e) => setEditColTitle(e.target.value)}
                                className="w-full p-2 bg-white border border-[#E5E3DB]"
                              />
                            </div>
                            <div>
                              <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Subtitle</label>
                              <input
                                type="text"
                                value={editColSubtitle}
                                onChange={(e) => setEditColSubtitle(e.target.value)}
                                className="w-full p-2 bg-white border border-[#E5E3DB]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Period</label>
                            <input
                              type="text"
                              value={editColPeriod}
                              onChange={(e) => setEditColPeriod(e.target.value)}
                              className="w-full p-2 bg-white border border-[#E5E3DB]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Description</label>
                            <textarea
                              rows={2}
                              value={editColDesc}
                              onChange={(e) => setEditColDesc(e.target.value)}
                              className="w-full p-2 bg-white border border-[#E5E3DB]"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingColId(null)}
                              className="px-3 py-1.5 border border-[#E5E3DB] bg-white text-[#6E6E66]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingCol}
                              className="px-4 py-1.5 bg-[#9E2A2B] text-white font-semibold uppercase tracking-wider"
                            >
                              {isSavingCol ? 'Saving...' : 'Save Collection'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E5E3DB]">
                          <div className="flex items-start gap-3">
                            {/* Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-[#8C8C82] hover:text-[#141413] p-1 mt-0.5 shrink-0"
                              title="Click and drag to reorder collection showcase position"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center flex-wrap gap-2 text-xs font-mono-archival text-[#8C8C82]">
                                <span className="px-2 py-0.5 bg-[#141413] text-[#FBFBFA] font-semibold text-[10px] tracking-wider">
                                  ORDER #{index + 1}
                                </span>
                                <span className="font-semibold text-[#141413] text-sm">{collection.title}</span>
                                <span>•</span>
                                <span>{collection.period}</span>
                                <span>•</span>
                                <span>{collectionStudies.length} Studies</span>
                              </div>
                              {collection.subtitle && (
                                <p className="font-serif text-sm text-[#6E6E66] italic mt-0.5">{collection.subtitle}</p>
                              )}
                              <p className="font-serif text-xs text-[#6E6E66] mt-1 max-w-2xl">{collection.description}</p>
                            </div>
                          </div>

                          {/* Order & Edit Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                            {/* Move Up / Down Buttons */}
                            <div className="flex items-center border border-[#E5E3DB] bg-white">
                              <button
                                onClick={() => handleMoveCollection(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-[#6E6E66] hover:text-[#141413] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#6E6E66] transition-colors"
                                title="Move Up in Showcase Order"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <div className="w-[1px] h-4 bg-[#E5E3DB]" />
                              <button
                                onClick={() => handleMoveCollection(index, 'down')}
                                disabled={index === sortedCollections.length - 1}
                                className="p-1 text-[#6E6E66] hover:text-[#141413] hover:bg-[#F4F3EE] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#6E6E66] transition-colors"
                                title="Move Down in Showcase Order"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => startEditCollection(collection)}
                              className="px-3 py-1 text-xs font-mono-archival border border-[#E5E3DB] bg-white hover:border-[#141413] shrink-0"
                            >
                              Edit Collection
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Studies inside this Collection */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[11px] font-mono-archival uppercase tracking-wider text-[#8C8C82]">
                          Studies in this Collection ({collectionStudies.length})
                        </span>

                        <div className="divide-y divide-[#E5E3DB] border border-[#E5E3DB] bg-white">
                          {collectionStudies.length === 0 ? (
                            <div className="p-3 text-xs font-serif text-[#8C8C82] italic">No studies in this collection yet.</div>
                          ) : (
                            collectionStudies.map((study) => {
                              const isEditingStudy = editingStudyId === study.id;
                              const studyEntries = entries.filter((e) => e.studyId === study.id);

                              return isEditingStudy ? (
                                <form key={study.id} onSubmit={handleSaveStudyEdit} className="p-4 bg-[#F4F3EE] space-y-3 text-xs font-mono-archival">
                                  <span className="font-semibold text-xs text-[#9E2A2B]">EDIT STUDY: {study.id}</span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Study Title</label>
                                      <input
                                        type="text"
                                        required
                                        value={editStudyTitle}
                                        onChange={(e) => setEditStudyTitle(e.target.value)}
                                        className="w-full p-2 bg-white border border-[#E5E3DB]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Subtitle</label>
                                      <input
                                        type="text"
                                        value={editStudySubtitle}
                                        onChange={(e) => setEditStudySubtitle(e.target.value)}
                                        className="w-full p-2 bg-white border border-[#E5E3DB]"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Parent Collection</label>
                                    <select
                                      value={editStudyColId}
                                      onChange={(e) => setEditStudyColId(e.target.value)}
                                      className="w-full p-2 bg-white border border-[#E5E3DB]"
                                    >
                                      {collections.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.title}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">Description</label>
                                    <textarea
                                      rows={2}
                                      value={editStudyDesc}
                                      onChange={(e) => setEditStudyDesc(e.target.value)}
                                      className="w-full p-2 bg-white border border-[#E5E3DB]"
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingStudyId(null)}
                                      className="px-3 py-1.5 border border-[#E5E3DB] bg-white text-[#6E6E66]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isSavingStudy}
                                      className="px-4 py-1.5 bg-[#9E2A2B] text-white font-semibold uppercase tracking-wider"
                                    >
                                      {isSavingStudy ? 'Saving...' : 'Save Study'}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div key={study.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#FAF9F5]">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 text-xs font-mono-archival">
                                      <span className="font-medium text-[#141413]">{study.title}</span>
                                      <span className="text-[#8C8C82]">•</span>
                                      <span className="text-[#8C8C82]">{studyEntries.length} entries</span>
                                    </div>
                                    {study.subtitle && (
                                      <p className="font-serif text-xs text-[#6E6E66] italic">{study.subtitle}</p>
                                    )}
                                    <p className="font-serif text-xs text-[#6E6E66] line-clamp-1">{study.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 text-xs font-mono-archival">
                                    <button
                                      type="button"
                                      onClick={() => onNavigate({ page: 'study', slug: study.slug })}
                                      className="px-2.5 py-1 border border-[#E5E3DB] bg-white hover:border-[#141413] text-[#6E6E66]"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEditStudy(study)}
                                      className="px-2.5 py-1 border border-[#E5E3DB] bg-white hover:border-[#141413] text-[#141413]"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Threads Management */}
        {activeTab === 'threads' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateThread} className="p-5 bg-[#F4F3EE] border border-[#E5E3DB] flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="New Thread Name (e.g. Topography)"
                value={newThreadName}
                onChange={(e) => setNewThreadName(e.target.value)}
                className="flex-1 p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
              />
              <input
                type="text"
                placeholder="Brief description"
                value={newThreadDesc}
                onChange={(e) => setNewThreadDesc(e.target.value)}
                className="flex-1 p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] text-xs font-mono-archival"
              >
                Add Thread
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {threads.map((thread) => {
                const count = entries.filter((e) => e.threadIds.includes(thread.id)).length;
                return (
                  <div key={thread.id} className="p-4 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-archival">
                      <span className="text-[#9E2A2B] font-semibold">#{thread.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#8C8C82]">{count} Entries</span>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete thread "${thread.name}"?`)) {
                              try {
                                await deleteThread(thread.id);
                                setSuccessMessage(`Thread "${thread.name}" deleted.`);
                                setTimeout(() => setSuccessMessage(null), 3000);
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : 'Error deleting thread';
                                setErrorMessage(`Failed to delete thread: ${msg}`);
                              }
                            }
                          }}
                          className="text-[#8C8C82] hover:text-red-700"
                          title="Delete Thread"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {thread.description && (
                      <p className="font-serif text-xs text-[#6E6E66]">
                        {thread.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Backup & Portability Footer */}
        <div className="pt-8 border-t border-[#E5E3DB] flex flex-wrap items-center justify-between gap-4 text-xs font-mono-archival text-[#8C8C82]">
          <span>PORTABILITY: Plaintext JSON Archive Schema</span>
          <button
            onClick={handleExportData}
            className="px-3 py-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413] hover:border-[#141413] flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive JSON</span>
          </button>
        </div>
      </div>

      {/* Reader Preview Modal for Entries */}
      {previewingEntry && (
        <EntryReaderPreview
          entry={previewingEntry}
          collection={collections.find((c) => c.id === previewingEntry.collectionId)}
          study={studies.find((s) => s.id === previewingEntry.studyId)}
          threads={threads.filter((t) => previewingEntry.threadIds?.includes(t.id))}
          relatedStudies={studies.filter((s) => previewingEntry.relatedStudyIds?.includes(s.id))}
          relatedEntries={entries.filter((e) => previewingEntry.relatedEntryIds?.includes(e.id))}
          onClose={() => setPreviewingEntry(null)}
        />
      )}
    </div>
  );
};
