import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ArrowUpDown, ChevronRight, CornerDownRight, Tag } from 'lucide-react';
import { AppView } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface ArchiveIndexTableProps {
  onNavigate: (view: AppView) => void;
  initialThread?: string;
  initialCollection?: string;
}

export const ArchiveIndexTable: React.FC<ArchiveIndexTableProps> = ({
  onNavigate,
  initialThread,
  initialCollection,
}) => {
  const { collections, studies, entries, threads, getCollection, getStudy, getThread } = useArchive();

  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection || 'all');
  const [selectedThread, setSelectedThread] = useState<string>(initialThread || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'entryNumber' | 'title'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.visibility === 'published')
      .filter((entry) => {
        if (selectedCollection !== 'all' && entry.collectionId !== selectedCollection) {
          return false;
        }
        if (selectedThread !== 'all' && !entry.threadIds.includes(selectedThread)) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const matchTitle = entry.title.toLowerCase().includes(query);
          const matchLocation = entry.location?.toLowerCase().includes(query);
          const matchSummary = entry.summary?.toLowerCase().includes(query);
          const matchNum = entry.entryNumber.includes(query);
          const matchRev = entry.ruiRevision.toLowerCase().includes(query);
          return matchTitle || matchLocation || matchSummary || matchNum || matchRev;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const timeA = new Date(a.createdDate.replace(/\./g, '-')).getTime();
          const timeB = new Date(b.createdDate.replace(/\./g, '-')).getTime();
          return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
        }
        if (sortField === 'entryNumber') {
          const numA = parseInt(a.entryNumber, 10) || 0;
          const numB = parseInt(b.entryNumber, 10) || 0;
          return sortDirection === 'desc' ? numB - numA : numA - numB;
        }
        if (sortField === 'title') {
          return sortDirection === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [entries, selectedCollection, selectedThread, searchQuery, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'entryNumber' | 'title') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const hasActiveFilters = selectedCollection !== 'all' || selectedThread !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setSelectedCollection('all');
    setSelectedThread('all');
    setSearchQuery('');
  };

  return (
    <div className="py-12 md:py-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Archive Title & Telemetry Header */}
        <header className="pb-8 border-b border-[#E5E3DB] flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono-archival text-[#8C8C82] tracking-wider uppercase mb-1">
              <span>Section 03</span>
              <span>•</span>
              <span className="text-[#9E2A2B] font-medium">COMPREHENSIVE CATALOG</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#141413] font-medium">
              Archive Index
            </h1>
            <p className="font-serif text-base text-[#5C5C54] mt-2 max-w-2xl leading-relaxed">
              Database-style ledger of all cataloged Laboratory entries, cross-referenced by chronology, collections, studies, and conceptual threads.
            </p>
          </div>

          <div className="text-xs font-mono-archival text-[#8C8C82] space-y-1">
            <div>TOTAL SYSTEM RECORDS: {entries.filter(e => e.visibility === 'published').length}</div>
            <div>MATCHING VIEW: <span className="text-[#141413] font-semibold">{filteredEntries.length}</span></div>
          </div>
        </header>

        {/* Database Query Controls Ribbon */}
        <div className="p-4 bg-[#F4F3EE] border border-[#E5E3DB] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono-archival">
            {/* Search Input */}
            <div className="relative">
              <span className="block text-[10px] text-[#8C8C82] uppercase mb-1">
                Filter Text / Location
              </span>
              <div className="relative">
                <input
                  id="archive-search-input"
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] focus:outline-hidden focus:border-[#141413] text-xs font-mono-archival"
                />
                <Search className="w-3.5 h-3.5 text-[#8C8C82] absolute left-2.5 top-2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-[#8C8C82] hover:text-[#141413]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Collection Filter Dropdown */}
            <div>
              <span className="block text-[10px] text-[#8C8C82] uppercase mb-1">
                Filter Collection
              </span>
              <select
                id="archive-collection-select"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] focus:outline-hidden focus:border-[#141413] text-xs font-mono-archival"
              >
                <option value="all">All Collections ({collections.length})</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Thread Filter Dropdown */}
            <div>
              <span className="block text-[10px] text-[#8C8C82] uppercase mb-1">
                Filter Thread
              </span>
              <select
                id="archive-thread-select"
                value={selectedThread}
                onChange={(e) => setSelectedThread(e.target.value)}
                className="w-full py-1.5 px-2 bg-[#FBFBFA] border border-[#E5E3DB] text-[#141413] focus:outline-hidden focus:border-[#141413] text-xs font-mono-archival"
              >
                <option value="all">All Conceptual Threads ({threads.length})</option>
                {threads.map((thread) => (
                  <option key={thread.id} value={thread.id}>
                    #{thread.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear & Stats */}
            <div className="flex items-end">
              {hasActiveFilters ? (
                <button
                  id="archive-clear-filters-btn"
                  onClick={clearFilters}
                  className="w-full py-1.5 px-3 bg-[#EAE8E0] hover:bg-[#DEDCD4] text-[#141413] border border-[#D5D3CB] transition-colors flex items-center justify-center space-x-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              ) : (
                <div className="text-[11px] text-[#8C8C82] py-1.5">
                  Displaying full database sequence
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database Table View */}
        <div className="border border-[#E5E3DB] bg-[#FBFBFA] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono-archival">
            <thead>
              <tr className="bg-[#EAE8E0] text-[#6E6E66] border-b border-[#E5E3DB] select-none">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-[#141413] whitespace-nowrap"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>DATE</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('entryNumber')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-[#141413] whitespace-nowrap"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>ENTRY</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-2 font-medium whitespace-nowrap">
                  REV
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 font-medium cursor-pointer hover:text-[#141413] min-w-[240px]"
                >
                  <span className="inline-flex items-center space-x-1">
                    <span>TITLE &amp; INQUIRY</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap hidden md:table-cell">
                  STUDY &amp; COLLECTION
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap hidden lg:table-cell">
                  LOCATION
                </th>
                <th className="py-3 px-4 font-medium whitespace-nowrap hidden sm:table-cell">
                  THREADS
                </th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DB]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C8C82]">
                    No archive records match your query.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const collection = getCollection(entry.collectionId);
                  const study = getStudy(entry.studyId);

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => onNavigate({ page: 'entry', slug: entry.slug })}
                      className="hover:bg-[#F4F3EE] cursor-pointer transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-[#141413] whitespace-nowrap">
                        {entry.createdDate}
                      </td>

                      {/* Entry # */}
                      <td className="py-3.5 px-3 text-[#141413] whitespace-nowrap">
                        0{entry.entryNumber}
                      </td>

                      {/* Revision */}
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        <span className="px-1 py-0.2 bg-[#EAE8E0] text-[#9E2A2B] text-[10px]">
                          {entry.ruiRevision}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4">
                        <span className="font-serif text-sm md:text-base text-[#141413] group-hover:text-[#9E2A2B] font-medium leading-snug">
                          {entry.title}
                        </span>
                      </td>

                      {/* Study & Collection */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-[#6E6E66]">
                        <div className="truncate max-w-[200px]">
                          {study?.title || '—'}
                        </div>
                        <div className="text-[10px] text-[#8C8C82] truncate max-w-[200px]">
                          {collection?.title || '—'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-[#8C8C82] whitespace-nowrap">
                        {entry.location || '—'}
                      </td>

                      {/* Threads */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {entry.threadIds.slice(0, 2).map((tId) => {
                            const t = getThread(tId);
                            return t ? (
                              <span
                                key={t.id}
                                className="text-[10px] px-1 bg-[#EAE8E0]/70 text-[#4A4A44] border border-[#E5E3DB]"
                              >
                                #{t.name}
                              </span>
                            ) : null;
                          })}
                          {entry.threadIds.length > 2 && (
                            <span className="text-[10px] text-[#8C8C82]">
                              +{entry.threadIds.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Arrow indicator */}
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-[#8C8C82] group-hover:text-[#141413] group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
