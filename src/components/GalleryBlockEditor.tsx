import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid,
  Play,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  X,
  RefreshCw,
  GripVertical,
} from 'lucide-react';
import { GalleryImage, GalleryDisplay, EntryBlock } from '../types';
import { api } from '../services/api';

export interface GalleryBlockEditorProps {
  block: Extract<EntryBlock, { type: 'gallery' }>;
  onChange: (updated: Extract<EntryBlock, { type: 'gallery' }>) => void;
}

interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const GalleryBlockEditor: React.FC<GalleryBlockEditorProps> = ({
  block,
  onChange,
}) => {
  const images = block.images || [];
  const display = block.display || 'grid';

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddUrlModal, setShowAddUrlModal] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualCaption, setManualCaption] = useState('');
  const [manualAlt, setManualAlt] = useState('');

  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);

  // Drag and drop reordering state
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Presentation Mode Toggle
  // ---------------------------------------------------------------------------
  const setDisplayMode = (newDisplay: GalleryDisplay) => {
    onChange({ ...block, display: newDisplay });
  };

  // ---------------------------------------------------------------------------
  // Photo Array Mutations
  // ---------------------------------------------------------------------------
  const updateImageAt = (index: number, updates: Partial<GalleryImage>) => {
    const copy = [...images];
    copy[index] = { ...copy[index], ...updates };
    onChange({ ...block, images: copy });
  };

  const removeImageAt = (index: number) => {
    const copy = images.filter((_, i) => i !== index);
    onChange({ ...block, images: copy });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= images.length || toIndex >= images.length) {
      return;
    }
    const copy = [...images];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    onChange({ ...block, images: copy });
  };

  const addManualImage = () => {
    if (!manualUrl.trim()) return;
    const newImage: GalleryImage = {
      url: manualUrl.trim(),
      caption: manualCaption.trim() || undefined,
      alt: manualAlt.trim() || undefined,
    };
    onChange({ ...block, images: [...images, newImage] });
    setManualUrl('');
    setManualCaption('');
    setManualAlt('');
    setShowAddUrlModal(false);
  };

  // ---------------------------------------------------------------------------
  // Batch Upload Queue with Controlled Concurrency (Limit = 3)
  // ---------------------------------------------------------------------------
  const processQueue = useCallback(
    async (currentQueue: QueueItem[]) => {
      // Find items currently uploading
      const inFlight = currentQueue.filter((item) => item.status === 'uploading');
      if (inFlight.length >= MAX_CONCURRENT_UPLOADS) {
        return;
      }

      // Find pending items to start
      const availableSlots = MAX_CONCURRENT_UPLOADS - inFlight.length;
      const pendingItems = currentQueue.filter((item) => item.status === 'pending').slice(0, availableSlots);

      if (pendingItems.length === 0) {
        return;
      }

      // Mark selected pending items as uploading
      const itemIdsToStart = new Set(pendingItems.map((i) => i.id));
      setUploadQueue((prev) =>
        prev.map((item) =>
          itemIdsToStart.has(item.id) ? { ...item, status: 'uploading' } : item
        )
      );
      setActiveUploadsCount((prev) => prev + pendingItems.length);

      // Launch uploads concurrently up to concurrency limit
      pendingItems.forEach(async (item) => {
        try {
          const res = await api.uploadMedia(item.file);
          // 1. Append successfully uploaded image to gallery
          const newImg: GalleryImage = {
            url: res.url,
            caption: '',
            alt: item.name.replace(/\.[^/.]+$/, ''),
          };
          onChange({
            ...block,
            images: [...(block.images || []), newImg],
          });

          // 2. Mark queue item as completed
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'completed' } : q))
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Upload failed';
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: errMsg } : q))
          );
        } finally {
          setActiveUploadsCount((prev) => Math.max(0, prev - 1));
          // Trigger next in queue
          setUploadQueue((latest) => {
            setTimeout(() => processQueue(latest), 10);
            return latest;
          });
        }
      });
    },
    [block, onChange]
  );

  const enqueueFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: QueueItem[] = fileArray.map((file, idx) => {
      const id = `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      const lower = file.name.toLowerCase();

      // Per-file pre-validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
          id,
          file,
          name: file.name,
          size: file.size,
          status: 'error',
          error: `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB (Exceeds 10 MB limit)`,
        };
      }

      if (lower.endsWith('.heic') || lower.endsWith('.heif')) {
        return {
          id,
          file,
          name: file.name,
          size: file.size,
          status: 'error',
          error: 'HEIC format not supported. Convert to JPEG, PNG, or WebP.',
        };
      }

      return {
        id,
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
      };
    });

    setUploadQueue((prev) => {
      const updated = [...prev, ...newItems];
      setTimeout(() => processQueue(updated), 10);
      return updated;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      enqueueFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      enqueueFiles(e.dataTransfer.files);
    }
  };

  const retryFailedUpload = (id: string) => {
    setUploadQueue((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, status: 'pending' as const, error: undefined } : item
      );
      setTimeout(() => processQueue(updated), 10);
      return updated;
    });
  };

  const dismissQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompletedQueue = () => {
    setUploadQueue((prev) => prev.filter((item) => item.status === 'uploading' || item.status === 'pending'));
  };

  // Queue summary counts
  const totalQueueCount = uploadQueue.length;
  const completedQueueCount = uploadQueue.filter((q) => q.status === 'completed').length;
  const errorQueueCount = uploadQueue.filter((q) => q.status === 'error').length;
  const activeQueueCount = uploadQueue.filter((q) => q.status === 'uploading' || q.status === 'pending').length;

  return (
    <div className="space-y-4 font-mono-archival text-xs">
      {/* Hidden File Input (supports multiple file selection) */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Bar: Presentation Selector & Photo Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#FBFBFA] border border-[#E5E3DB]">
        <div className="flex items-center space-x-2">
          <span className="text-[#8C8C82] text-[10px] uppercase tracking-wider font-semibold">
            Presentation:
          </span>
          <div className="inline-flex border border-[#E5E3DB] bg-[#F4F3EE] p-0.5">
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              className={`px-2.5 py-1 text-[11px] flex items-center space-x-1.5 transition-colors ${
                display === 'grid'
                  ? 'bg-[#141413] text-[#FBFBFA] font-medium'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('slideshow')}
              className={`px-2.5 py-1 text-[11px] flex items-center space-x-1.5 transition-colors ${
                display === 'slideshow'
                  ? 'bg-[#141413] text-[#FBFBFA] font-medium'
                  : 'text-[#6E6E66] hover:text-[#141413]'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Slideshow</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[#141413] font-semibold text-xs">
            {images.length} {images.length === 1 ? 'PHOTO' : 'PHOTOS'}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#2C2C28] flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Add Photos</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed text-center transition-colors ${
          isDragging
            ? 'border-[#9E2A2B] bg-[#9E2A2B]/5'
            : 'border-[#D5D3CB] bg-[#FBFBFA] hover:border-[#141413]'
        }`}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-[#8C8C82]" />
        <p className="text-sm font-medium text-[#141413]">
          Drag and drop multiple photos here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="underline text-[#9E2A2B] hover:text-[#141413]"
          >
            browse your files
          </button>
        </p>
        <p className="text-[11px] text-[#8C8C82] mt-1">
          Open-ended batch uploads are processed automatically in a controlled 3-stream queue. JPEG, PNG, WebP, GIF, AVIF (max 10 MB per image).
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAddUrlModal(!showAddUrlModal)}
            className="text-[11px] text-[#6E6E66] hover:text-[#141413] inline-flex items-center space-x-1 underline"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showAddUrlModal ? 'Hide manual URL input' : 'Add photo by image URL'}</span>
          </button>
        </div>
      </div>

      {/* Manual URL Input Form (if toggled) */}
      {showAddUrlModal && (
        <div className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2.5">
          <span className="text-[10px] uppercase text-[#8C8C82] font-semibold block">
            Add Photo via Direct URL
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://... image URL"
              className="p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413] col-span-1 md:col-span-2"
            />
            <input
              type="text"
              value={manualCaption}
              onChange={(e) => setManualCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddUrlModal(false)}
              className="px-2.5 py-1 border border-[#E5E3DB] text-[#6E6E66] hover:bg-[#EAE8E0]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addManualImage}
              disabled={!manualUrl.trim()}
              className="px-3 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#2C2C28] disabled:opacity-40"
            >
              Add to Gallery
            </button>
          </div>
        </div>
      )}

      {/* Active Upload Queue Status Indicator */}
      {totalQueueCount > 0 && (
        <div className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-archival">
            <div className="flex items-center space-x-2">
              {activeQueueCount > 0 && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9E2A2B]" />}
              <span className="font-semibold text-[#141413]">
                {activeQueueCount > 0
                  ? `Uploading Queue: ${completedQueueCount} of ${totalQueueCount} completed (${activeUploadsCount} active concurrent)`
                  : `Batch Upload Complete: ${completedQueueCount} added${errorQueueCount > 0 ? `, ${errorQueueCount} failed` : ''}`}
              </span>
            </div>
            {activeQueueCount === 0 && (
              <button
                type="button"
                onClick={clearCompletedQueue}
                className="text-[11px] text-[#8C8C82] hover:text-[#141413] underline"
              >
                Dismiss Queue
              </button>
            )}
          </div>

          {/* Simple Progress Bar */}
          <div className="w-full bg-[#E5E3DB] h-1.5 overflow-hidden">
            <div
              className="bg-[#9E2A2B] h-full transition-all duration-300"
              style={{
                width: `${totalQueueCount > 0 ? (completedQueueCount / totalQueueCount) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Failed Items List */}
          {errorQueueCount > 0 && (
            <div className="space-y-1.5 pt-1">
              {uploadQueue
                .filter((q) => q.status === 'error')
                .map((failed) => (
                  <div
                    key={failed.id}
                    className="flex items-center justify-between text-[11px] p-1.5 bg-red-50 border border-red-200 text-red-800"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span className="font-medium truncate max-w-xs">{failed.name}</span>
                      <span className="text-red-600 text-[10px]">({failed.error})</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => retryFailedUpload(failed.id)}
                        className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 flex items-center space-x-1"
                        title="Retry upload"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissQueueItem(failed.id)}
                        className="p-1 hover:text-red-950"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery Thumbnail Grid / Editor */}
      {images.length === 0 ? (
        <div className="py-8 text-center text-[#8C8C82] border border-[#E5E3DB] bg-[#FBFBFA]">
          No photographs in this gallery yet. Click &quot;Add Photos&quot; or drop image files above.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[11px] text-[#8C8C82] flex items-center justify-between">
            <span>
              Order is preserved sequentially. Drag thumbnails to reorder, or use the arrow buttons.
            </span>
            <span>Presentation: <strong className="text-[#141413] uppercase">{display}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {images.map((img, idx) => {
              const isDraggingThis = draggedPhotoIndex === idx;
              const isDragTarget = dragOverIndex === idx && !isDraggingThis;

              return (
                <div
                  key={`${img.url}-${idx}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx));
                    setDraggedPhotoIndex(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverIndex !== idx) setDragOverIndex(idx);
                  }}
                  onDragLeave={() => {
                    if (dragOverIndex === idx) setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromStr = e.dataTransfer.getData('text/plain');
                    const from = fromStr !== '' ? parseInt(fromStr, 10) : draggedPhotoIndex;
                    if (from !== null && !isNaN(from)) {
                      moveImage(from, idx);
                    }
                    setDraggedPhotoIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedPhotoIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`p-3 bg-[#FBFBFA] border transition-all flex flex-col justify-between space-y-2 relative cursor-move ${
                    isDraggingThis
                      ? 'opacity-40 border-dashed border-[#141413]'
                      : isDragTarget
                      ? 'border-[#9E2A2B] ring-2 ring-[#9E2A2B]/20'
                      : 'border-[#E5E3DB] hover:border-[#141413]'
                  }`}
                >
                  {/* Photo Top Bar: Number, Move Controls, Remove */}
                  <div className="flex items-center justify-between text-[#8C8C82] border-b border-[#EFEFEA] pb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-[#8C8C82]" />
                      <span className="font-semibold text-[#141413] text-[11px]">
                        PHOTO #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 border border-[#E5E3DB] hover:bg-[#EAE8E0] text-[#6E6E66] disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Earlier"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        disabled={idx === images.length - 1}
                        className="p-1 border border-[#E5E3DB] hover:bg-[#EAE8E0] text-[#6E6E66] disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Later"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="p-1 hover:bg-red-50 text-red-700 ml-1.5"
                        title="Remove photo from gallery"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail & Inputs Row */}
                  <div className="flex items-start space-x-3 pt-1">
                    {/* Thumbnail Plate */}
                    <div className="w-20 h-20 bg-[#F4F3EE] border border-[#E5E3DB] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.alt || `Photo ${idx + 1}`}
                        className="max-h-full max-w-full w-auto h-auto object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Captions & Alt Text Fields */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <label className="block text-[9px] text-[#8C8C82] uppercase mb-0.5">
                          Caption (Optional)
                        </label>
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => updateImageAt(idx, { caption: e.target.value })}
                          placeholder="e.g. Architectural elevation, natural light"
                          className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#141413] text-xs font-serif placeholder:font-mono-archival placeholder:text-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-[#8C8C82] uppercase mb-0.5">
                          Alt Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={img.alt || ''}
                          onChange={(e) => updateImageAt(idx, { alt: e.target.value })}
                          placeholder="Accessible description"
                          className="w-full p-1.5 bg-[#F4F3EE] border border-[#E5E3DB] text-[#6E6E66] text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
