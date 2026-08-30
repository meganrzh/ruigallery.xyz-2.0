import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
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
} from 'lucide-react';
import {
  Entry,
  CuratedWork,
  Collection,
  Study,
  Thread,
  EntryBlock,
  AppView,
  RuiRevision,
} from '../types';
import { useArchive } from '../context/ArchiveContext';

interface AdminDashboardProps {
  onNavigate: (view: AppView) => void;
  subTab?: 'entries' | 'work' | 'collections' | 'threads' | 'new-entry' | 'new-work';
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
    addCuratedWork,
    updateCuratedWork,
    deleteCuratedWork,
    addCollection,
    updateCollection,
    addStudy,
    updateStudy,
    addThread,
    deleteThread,
    resetToDefaultData,
  } = useArchive();

  const [activeTab, setActiveTab] = useState<'entries' | 'work' | 'collections' | 'threads' | 'new-entry' | 'new-work'>(
    subTab
  );

  // New Entry Form State
  const [entryTitle, setEntryTitle] = useState('');
  const [entryCollectionId, setEntryCollectionId] = useState(collections[0]?.id || '');
  const [entryStudyId, setEntryStudyId] = useState(studies[0]?.id || '');
  const [entryRevision, setEntryRevision] = useState<RuiRevision>('REV 00');
  const [entryLocation, setEntryLocation] = useState('San Francisco, CA');
  const [entrySummary, setEntrySummary] = useState('');
  const [entryThreadIds, setEntryThreadIds] = useState<string[]>([]);
  const [entryRelatedStudyIds, setEntryRelatedStudyIds] = useState<string[]>([]);
  const [entryVisibility, setEntryVisibility] = useState<'published' | 'draft'>('published');
  const [entryBlocks, setEntryBlocks] = useState<EntryBlock[]>([
    { type: 'paragraph', content: 'Type primary research observation or narrative note here...' },
  ]);

  // Preview Modal
  const [previewEntry, setPreviewEntry] = useState<Entry | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Helper for available studies based on collection
  const availableStudies = studies.filter((s) => s.collectionId === entryCollectionId);

  // Handle adding block to new entry
  const addBlock = (type: 'paragraph' | 'fragment' | 'image' | 'observation' | 'reference' | 'list') => {
    switch (type) {
      case 'paragraph':
        setEntryBlocks([...entryBlocks, { type: 'paragraph', content: '' }]);
        break;
      case 'fragment':
        setEntryBlocks([...entryBlocks, { type: 'fragment', note: '', source: '' }]);
        break;
      case 'image':
        setEntryBlocks([
          ...entryBlocks,
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
            caption: 'Archival documentation scan.',
          },
        ]);
        break;
      case 'observation':
        setEntryBlocks([
          ...entryBlocks,
          {
            type: 'observation',
            date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
            coordinates: '37.7749° N, 122.4194° W',
            text: '',
          },
        ]);
        break;
      case 'reference':
        setEntryBlocks([...entryBlocks, { type: 'reference', citation: '', link: '' }]);
        break;
      case 'list':
        setEntryBlocks([...entryBlocks, { type: 'list', items: ['Field measurement 1', 'Field measurement 2'] }]);
        break;
    }
  };

  const removeBlock = (index: number) => {
    setEntryBlocks(entryBlocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, updated: EntryBlock) => {
    const next = [...entryBlocks];
    next[index] = updated;
    setEntryBlocks(next);
  };

  // Submit Entry
  const handlePublishEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim()) {
      alert('Please enter an Entry Title.');
      return;
    }

    const nextEntryNumber = String(entries.length + 1).padStart(3, '0');
    const slug = `entry-${nextEntryNumber}-${entryTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}`;

    const createdDate = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

    const newEntry = addEntry({
      slug,
      entryNumber: nextEntryNumber,
      collectionId: entryCollectionId,
      studyId: entryStudyId || availableStudies[0]?.id || studies[0]?.id,
      title: entryTitle,
      ruiRevision: entryRevision,
      createdDate,
      publishedDate: createdDate,
      location: entryLocation,
      threadIds: entryThreadIds,
      relatedStudyIds: entryRelatedStudyIds,
      summary: entrySummary,
      blocks: entryBlocks,
      visibility: entryVisibility,
    });

    setSuccessMessage(`Entry ${nextEntryNumber} published successfully to archive!`);
    setTimeout(() => setSuccessMessage(null), 4000);
    setActiveTab('entries');

    // Reset Form
    setEntryTitle('');
    setEntrySummary('');
    setEntryBlocks([{ type: 'paragraph', content: '' }]);
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
      order: collections.length + 1,
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
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadName) return;
    const slug = newThreadName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addThread({
      slug,
      name: newThreadName,
      description: newThreadDesc,
    });
    setNewThreadName('');
    setNewThreadDesc('');
    setSuccessMessage(`Thread "#${newThreadName}" created!`);
    setTimeout(() => setSuccessMessage(null), 3000);
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
                <span>AUTHENTICATED STUDIO VIEW</span>
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
              <span className="text-[#8C8C82] text-[10px] block">ENTRIES</span>
              <span className="text-lg font-serif">{entries.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block">CURATED WORKS</span>
              <span className="text-lg font-serif">{curatedWorks.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block">STUDIES</span>
              <span className="text-lg font-serif">{studies.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block">COLLECTIONS</span>
              <span className="text-lg font-serif">{collections.length}</span>
            </div>
            <div className="p-2 bg-[#1C1C1A]">
              <span className="text-[#8C8C82] text-[10px] block">THREADS</span>
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

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E3DB] pb-3 text-xs font-mono-archival">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'entries'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Entries ({entries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new-entry')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'new-entry'
                ? 'bg-[#9E2A2B] text-[#FBFBFA] border-[#9E2A2B] font-medium'
                : 'bg-[#9E2A2B]/10 text-[#9E2A2B] border-[#9E2A2B]/30 hover:bg-[#9E2A2B]/20'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Author New Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('work')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'work'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Works ({curatedWorks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-1.5 border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'collections'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Collections &amp; Studies</span>
          </button>

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

        {/* Tab 1: Entries Management */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#141413] font-medium">
                Cataloged Laboratory Entries
              </h2>
              <button
                onClick={() => setActiveTab('new-entry')}
                className="text-xs font-mono-archival px-3 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#9E2A2B] transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Entry</span>
              </button>
            </div>

            <div className="border border-[#E5E3DB] bg-[#FBFBFA] divide-y divide-[#E5E3DB]">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F4F3EE]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82]">
                      <span className="text-[#141413] font-semibold">{entry.createdDate}</span>
                      <span>•</span>
                      <span>ENTRY {entry.entryNumber}</span>
                      <span className="px-1 py-0.2 bg-[#EAE8E0] text-[#9E2A2B]">{entry.ruiRevision}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] ${entry.visibility === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {entry.visibility.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-serif text-base text-[#141413] font-medium">
                      {entry.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono-archival shrink-0">
                    <button
                      onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                      className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#141413] flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        const newVis = entry.visibility === 'published' ? 'draft' : 'published';
                        updateEntry(entry.id, { visibility: newVis });
                      }}
                      className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413] text-[#6E6E66]"
                    >
                      {entry.visibility === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete entry "${entry.title}"?`)) {
                          deleteEntry(entry.id);
                        }
                      }}
                      className="p-1 text-[#8C8C82] hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Author New Entry Form */}
        {activeTab === 'new-entry' && (
          <form onSubmit={handlePublishEntry} className="space-y-8 bg-[#F4F3EE] p-6 sm:p-8 border border-[#E5E3DB]">
            <div className="border-b border-[#E5E3DB] pb-4">
              <h2 className="font-serif text-2xl text-[#141413] font-medium">
                Author Laboratory Entry
              </h2>
              <p className="font-serif text-xs text-[#6E6E66] italic mt-1">
                Rigid metadata scaffolding + flexible notebook content blocks.
              </p>
            </div>

            {/* Rigid Metadata Scaffold Form */}
            <div className="p-4 bg-[#FBFBFA] border border-[#E5E3DB] space-y-4">
              <span className="text-xs font-mono-archival text-[#9E2A2B] uppercase tracking-wider block font-semibold">
                Rigid Metadata Header
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono-archival">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    Entry Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Istrian Stone Mooring Bollards Survey"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] font-serif text-base focus:outline-hidden focus:border-[#141413]"
                  />
                </div>

                {/* Revision */}
                <div>
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    RUI Revision *
                  </label>
                  <select
                    value={entryRevision}
                    onChange={(e) => setEntryRevision(e.target.value as RuiRevision)}
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                  >
                    <option value="REV 00">REV 00 (Initial State)</option>
                    <option value="REV 01">REV 01 (Major Maturation)</option>
                    <option value="REV 02">REV 02 (Expanded Fieldwork)</option>
                    <option value="REV 03">REV 03 (Resolved Thesis)</option>
                  </select>
                </div>

                {/* Collection */}
                <div>
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    Collection *
                  </label>
                  <select
                    value={entryCollectionId}
                    onChange={(e) => setEntryCollectionId(e.target.value)}
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Study */}
                <div>
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    Study (Belongs to Collection) *
                  </label>
                  <select
                    value={entryStudyId}
                    onChange={(e) => setEntryStudyId(e.target.value)}
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                  >
                    {availableStudies.length > 0 ? (
                      availableStudies.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))
                    ) : (
                      <option value="">(No studies in collection)</option>
                    )}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[#8C8C82] text-[10px] uppercase mb-1">
                    Location / Coordinate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Venice (Dorsoduro)"
                    value={entryLocation}
                    onChange={(e) => setEntryLocation(e.target.value)}
                    className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                  />
                </div>
              </div>

              {/* Threads Multi-Select */}
              <div className="pt-3 border-t border-[#EFEFEA]">
                <label className="block text-[#8C8C82] text-[10px] uppercase font-mono-archival mb-1.5">
                  Assign Conceptual Threads
                </label>
                <div className="flex flex-wrap gap-2">
                  {threads.map((t) => {
                    const isChecked = entryThreadIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`text-xs font-mono-archival px-2 py-1 border cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-[#9E2A2B] text-[#FBFBFA] border-[#9E2A2B]'
                            : 'bg-[#FBFBFA] text-[#4A4A44] border-[#E5E3DB]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEntryThreadIds(entryThreadIds.filter((id) => id !== t.id));
                            } else {
                              setEntryThreadIds([...entryThreadIds, t.id]);
                            }
                          }}
                        />
                        #{t.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[#8C8C82] text-[10px] uppercase font-mono-archival mb-1">
                  Brief Summary / Thesis Teaser
                </label>
                <input
                  type="text"
                  placeholder="One sentence description of the entry observation."
                  value={entrySummary}
                  onChange={(e) => setEntrySummary(e.target.value)}
                  className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] font-serif text-sm"
                />
              </div>
            </div>

            {/* Flexible Notebook Content Blocks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-archival text-[#141413] uppercase tracking-wider font-semibold">
                  Flexible Notebook Content Blocks ({entryBlocks.length})
                </span>
                <div className="flex flex-wrap gap-1 text-xs font-mono-archival">
                  <button
                    type="button"
                    onClick={() => addBlock('paragraph')}
                    className="px-2 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413]"
                  >
                    + Paragraph
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('image')}
                    className="px-2 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413]"
                  >
                    + Image Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('fragment')}
                    className="px-2 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413]"
                  >
                    + Fragment
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('observation')}
                    className="px-2 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413]"
                  >
                    + Observation
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('reference')}
                    className="px-2 py-1 bg-[#FBFBFA] border border-[#E5E3DB] hover:border-[#141413]"
                  >
                    + Reference
                  </button>
                </div>
              </div>

              {/* Rendered Block Editors */}
              <div className="space-y-4">
                {entryBlocks.map((block, idx) => (
                  <div key={idx} className="p-4 bg-[#FBFBFA] border border-[#E5E3DB] space-y-3 relative group">
                    <div className="flex items-center justify-between text-xs font-mono-archival text-[#8C8C82]">
                      <span className="font-semibold text-[#141413]">
                        BLOCK {idx + 1}: {block.type.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBlock(idx)}
                        className="text-red-700 hover:underline text-[11px]"
                      >
                        Remove Block
                      </button>
                    </div>

                    {block.type === 'paragraph' && (
                      <textarea
                        rows={3}
                        value={block.content}
                        onChange={(e) => updateBlock(idx, { type: 'paragraph', content: e.target.value })}
                        placeholder="Write paragraph text..."
                        className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base text-[#141413]"
                      />
                    )}

                    {block.type === 'fragment' && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={block.note}
                          onChange={(e) => updateBlock(idx, { ...block, note: e.target.value })}
                          placeholder="Fragment note or pullquote..."
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base italic text-[#141413]"
                        />
                        <input
                          type="text"
                          value={block.source || ''}
                          onChange={(e) => updateBlock(idx, { ...block, source: e.target.value })}
                          placeholder="Source / Notebook reference"
                          className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66]"
                        />
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.url}
                          onChange={(e) => updateBlock(idx, { ...block, url: e.target.value })}
                          placeholder="Image URL"
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                        />
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) => updateBlock(idx, { ...block, caption: e.target.value })}
                          placeholder="Image Caption"
                          className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                        />
                      </div>
                    )}

                    {block.type === 'observation' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.text}
                          onChange={(e) => updateBlock(idx, { ...block, text: e.target.value })}
                          placeholder="Field observation text..."
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-base"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={block.date || ''}
                            onChange={(e) => updateBlock(idx, { ...block, date: e.target.value })}
                            placeholder="Observation Date"
                            className="p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                          />
                          <input
                            type="text"
                            value={block.coordinates || ''}
                            onChange={(e) => updateBlock(idx, { ...block, coordinates: e.target.value })}
                            placeholder="Coordinates (e.g. 37.77° N)"
                            className="p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                          />
                        </div>
                      </div>
                    )}

                    {block.type === 'reference' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={block.citation}
                          onChange={(e) => updateBlock(idx, { ...block, citation: e.target.value })}
                          placeholder="Bibliographic citation (e.g. Author, Title, Year)"
                          className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] font-serif text-sm"
                        />
                        <input
                          type="text"
                          value={block.link || ''}
                          onChange={(e) => updateBlock(idx, { ...block, link: e.target.value })}
                          placeholder="External URL link (optional)"
                          className="w-full p-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Publishing Controls */}
            <div className="pt-6 border-t border-[#E5E3DB] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-xs font-mono-archival">
                <label className="flex items-center space-x-1.5">
                  <input
                    type="radio"
                    name="visibility"
                    checked={entryVisibility === 'published'}
                    onChange={() => setEntryVisibility('published')}
                  />
                  <span>Published</span>
                </label>
                <label className="flex items-center space-x-1.5">
                  <input
                    type="radio"
                    name="visibility"
                    checked={entryVisibility === 'draft'}
                    onChange={() => setEntryVisibility('draft')}
                  />
                  <span>Draft</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('entries')}
                  className="px-4 py-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#6E6E66] hover:text-[#141413]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#9E2A2B] text-[#FBFBFA] hover:bg-[#801C1D] text-xs font-mono-archival tracking-wider uppercase font-semibold transition-colors"
                >
                  Publish to Archive
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Curated Works Management */}
        {activeTab === 'work' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#141413] font-medium">
                Curated Works Management
              </h2>
            </div>

            <div className="border border-[#E5E3DB] bg-[#FBFBFA] divide-y divide-[#E5E3DB]">
              {curatedWorks.map((work) => (
                <div
                  key={work.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F4F3EE]"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={work.coverImage}
                      alt={work.title}
                      className="w-16 h-16 object-cover border border-[#E5E3DB]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82]">
                        <span className="text-[#9E2A2B] font-medium">{work.workType}</span>
                        <span>•</span>
                        <span>{work.year}</span>
                        {work.featuredOnHome && (
                          <span className="px-1 py-0.2 bg-[#141413] text-[#FBFBFA] text-[10px]">
                            FEATURED ON HOME
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg text-[#141413] font-medium">
                        {work.title}
                      </h3>
                      {work.subtitle && (
                        <p className="font-serif text-xs text-[#6E6E66] italic">
                          {work.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono-archival shrink-0">
                    <button
                      onClick={() => onNavigate({ page: 'work', slug: work.slug })}
                      className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413]"
                    >
                      View Page
                    </button>
                    <button
                      onClick={() => {
                        updateCuratedWork(work.id, { featuredOnHome: !work.featuredOnHome });
                      }}
                      className="px-2.5 py-1 bg-[#FBFBFA] border border-[#E5E3DB] text-[#6E6E66]"
                    >
                      {work.featuredOnHome ? 'Unfeature from Home' : 'Feature on Home'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                      {collections.map((c) => (
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
              <h3 className="font-serif text-xl text-[#141413] font-medium pb-2 border-b border-[#E5E3DB]">
                Manage Existing Hierarchy & Studies
              </h3>

              <div className="space-y-6">
                {collections.map((collection) => {
                  const collectionStudies = studies.filter((s) => s.collectionId === collection.id);
                  const isEditingCol = editingColId === collection.id;

                  return (
                    <div key={collection.id} className="border border-[#E5E3DB] bg-[#FBFBFA] p-6 space-y-4">
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
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E3DB]">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-mono-archival text-[#8C8C82]">
                              <span className="font-semibold text-[#141413]">{collection.title}</span>
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
                          <button
                            onClick={() => startEditCollection(collection)}
                            className="px-3 py-1 text-xs font-mono-archival border border-[#E5E3DB] bg-white hover:border-[#141413] shrink-0"
                          >
                            Edit Collection
                          </button>
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
                      <span className="text-[#8C8C82]">{count} Entries</span>
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
    </div>
  );
};
