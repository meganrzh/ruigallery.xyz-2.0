import React, { useState, useRef } from 'react';
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
  GripVertical,
} from 'lucide-react';
import { GalleryImage, GalleryDisplay, EntryBlock } from '../types';
import { api } from '../services/api';

export interface GalleryBlockEditorProps {
  block: Extract<EntryBlock, { type: 'gallery' }>;
  onChange: (updated: Extract<EntryBlock, { type: 'gallery' }>) => void;
}

export interface BatchItem {
  id: string;
  index: number;
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

  // Batch Upload State (TEMPORARY UI ONLY - NEVER MUTATES block.images DURING UPLOADS)
  const [isUploading, setIsUploading] = useState(false);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });

  // Keep fresh references to block and onChange for batch completion
  const latestBlockRef = useRef(block);
  latestBlockRef.current = block;

  const latestOnChangeRef = useRef(onChange);
  latestOnChangeRef.current = onChange;

  // Drag and drop reordering state
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Presentation Mode Toggle
  // ---------------------------------------------------------------------------
  const setDisplayMode = (newDisplay: GalleryDisplay) => {
    latestOnChangeRef.current({ ...latestBlockRef.current, display: newDisplay });
  };

  // ---------------------------------------------------------------------------
  // Photo Array Mutations (Committed gallery content operations)
  // ---------------------------------------------------------------------------
  const updateImageAt = (index: number, updates: Partial<GalleryImage>) => {
    const copy = [...(latestBlockRef.current.images || [])];
    if (index < 0 || index >= copy.length) return;
    copy[index] = { ...copy[index], ...updates };
    latestOnChangeRef.current({ ...latestBlockRef.current, images: copy });
  };

  const removeImageAt = (index: number) => {
    const copy = (latestBlockRef.current.images || []).filter((_, i) => i !== index);
    latestOnChangeRef.current({ ...latestBlockRef.current, images: copy });
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const current = [...(latestBlockRef.current.images || [])];
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= current.length ||
      toIndex >= current.length
    ) {
      return;
    }
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    latestOnChangeRef.current({ ...latestBlockRef.current, images: current });
  };

  const addManualImage = () => {
    if (!manualUrl.trim()) return;
    const newImage: GalleryImage = {
      url: manualUrl.trim(),
      caption: manualCaption.trim() || undefined,
      alt: manualAlt.trim() || undefined,
    };
    const current = latestBlockRef.current.images || [];
    latestOnChangeRef.current({
      ...latestBlockRef.current,
      images: [...current, newImage],
    });
    setManualUrl('');
    setManualCaption('');
    setManualAlt('');
    setShowAddUrlModal(false);
  };

  // ---------------------------------------------------------------------------
  // BATCH PHOTO UPLOAD: ONE SELECTION = ONE BATCH
  // Uploads with max 3 concurrency, stores results indexed by selection position.
  // Appends the ENTIRE completed batch to Gallery in ONE parent onChange update.
  // ---------------------------------------------------------------------------
  const startBatchUpload = async (files: File[]) => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);

    // 1. Build initial queue items preserving original selection position
    const initialItems: BatchItem[] = files.map((file, idx) => {
      const lower = file.name.toLowerCase();
      const isHeic =
        lower.endsWith('.heic') ||
        lower.endsWith('.heif') ||
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.type === 'image/heic-sequence' ||
        file.type === 'image/heif-sequence';

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
          id: `batch-${Date.now()}-${idx}`,
          index: idx,
          file,
          name: file.name,
          size: file.size,
          status: 'error',
          error: `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB (Exceeds 10 MB limit)`,
        };
      }

      if (isHeic) {
        return {
          id: `batch-${Date.now()}-${idx}`,
          index: idx,
          file,
          name: file.name,
          size: file.size,
          status: 'error',
          error: 'HEIC format is not supported by browsers. Convert to JPEG, PNG, or WebP on iOS before uploading.',
        };
      }

      return {
        id: `batch-${Date.now()}-${idx}`,
        index: idx,
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
      };
    });

    setBatchQueue(initialItems);
    setBatchProgress({ completed: 0, total: initialItems.length });

    // 2. Results array indexed by selection position
    const results: (GalleryImage | null)[] = new Array(files.length).fill(null);

    // 3. Worker pool for controlled concurrency (max 3)
    const validItemsToUpload = initialItems.filter((i) => i.status === 'pending');
    let nextPointer = 0;
    let completedCount = initialItems.filter((i) => i.status === 'error').length;

    const runWorker = async () => {
      while (nextPointer < validItemsToUpload.length) {
        const item = validItemsToUpload[nextPointer++];

        // Update item status in UI queue
        setBatchQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
        );

        try {
          const res = await api.uploadMedia(item.file);
          // Store result at exact original selection index
          results[item.index] = {
            url: res.url,
            caption: '',
            alt: item.name.replace(/\.[^/.]+$/, ''),
          };

          setBatchQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'completed' } : q))
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Upload failed';
          results[item.index] = null;
          setBatchQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: errMsg } : q))
          );
        } finally {
          completedCount++;
          setBatchProgress({ completed: completedCount, total: initialItems.length });
        }
      }
    };

    const workerCount = Math.min(MAX_CONCURRENT_UPLOADS, validItemsToUpload.length);
    if (workerCount > 0) {
      const workers = Array.from({ length: workerCount }, () => runWorker());
      await Promise.all(workers);
    }

    // 4. BATCH COMPLETE: Filter successful images preserving selection order
    const successfulImages = results.filter((img): img is GalleryImage => img !== null);

    // 5. ONE SINGLE PARENT STATE UPDATE committing the entire batch
    if (successfulImages.length > 0) {
      const currentImages = latestBlockRef.current.images || [];
      const updatedImages = [...currentImages, ...successfulImages];
      latestOnChangeRef.current({
        ...latestBlockRef.current,
        images: updatedImages,
      });
    }

    setIsUploading(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    // Copy into detached Array before resetting value to prevent WebKit/Safari FileList invalidation
    const files: File[] = Array.from(fileList);
    e.target.value = '';
    startBatchUpload(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      startBatchUpload(files);
    }
  };

  const dismissBatchQueue = () => {
    if (!isUploading) {
      setBatchQueue([]);
    }
  };

  // Queue summary counts
  const totalQueueCount = batchQueue.length;
  const completedQueueCount = batchQueue.filter((q) => q.status === 'completed').length;
  const errorQueueCount = batchQueue.filter((q) => q.status === 'error').length;
  const pendingOrUploadingCount = batchQueue.filter(
    (q) => q.status === 'uploading' || q.status === 'pending'
  ).length;

  return (
    <div className="space-y-4 font-mono-archival text-xs">
      {/* Hidden File Input (supports multiple file selection & iOS JPEG/PNG/WebP/GIF/AVIF) */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileInputChange}
        disabled={isUploading}
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
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#2C2C28] disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1.5 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#9E2A2B]" />
                <span>Uploading ({batchProgress.completed}/{batchProgress.total})...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>Add Photos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed text-center transition-colors ${
          isUploading
            ? 'border-[#E5E3DB] bg-[#F4F3EE] opacity-60 cursor-not-allowed'
            : isDragging
            ? 'border-[#9E2A2B] bg-[#9E2A2B]/5'
            : 'border-[#D5D3CB] bg-[#FBFBFA] hover:border-[#141413]'
        }`}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-[#8C8C82]" />
        {isUploading ? (
          <p className="text-sm font-medium text-[#141413]">
            Uploading batch in progress ({batchProgress.completed} of {batchProgress.total} completed)...
          </p>
        ) : (
          <p className="text-sm font-medium text-[#141413]">
            Drag and drop multiple photos here, or{' '}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="underline text-[#9E2A2B] hover:text-[#141413] disabled:opacity-40"
            >
              browse your files
            </button>
          </p>
        )}
        <p className="text-[11px] text-[#8C8C82] mt-1">
          Batch uploads are processed with 3 concurrent streams and added atomically. JPEG, PNG, WebP, GIF, AVIF (max 10 MB per image).
        </p>
        <div className="mt-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => setShowAddUrlModal(!showAddUrlModal)}
            className="text-[11px] text-[#6E6E66] hover:text-[#141413] inline-flex items-center space-x-1 underline disabled:opacity-40"
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

      {/* Temporary Upload Queue / Progress Bar (Separated from Gallery content) */}
      {totalQueueCount > 0 && (
        <div className="p-3 bg-[#FBFBFA] border border-[#E5E3DB] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-archival">
            <div className="flex items-center space-x-2">
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9E2A2B]" />}
              <span className="font-semibold text-[#141413]">
                {isUploading
                  ? `Uploading Batch: ${batchProgress.completed} of ${batchProgress.total} completed (3 streams)`
                  : `Batch Upload Complete: ${completedQueueCount} added${errorQueueCount > 0 ? `, ${errorQueueCount} failed` : ''}`}
              </span>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={dismissBatchQueue}
                className="text-[11px] text-[#8C8C82] hover:text-[#141413] underline"
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#E5E3DB] h-1.5 overflow-hidden">
            <div
              className="bg-[#9E2A2B] h-full transition-all duration-300"
              style={{
                width: `${totalQueueCount > 0 ? (batchProgress.completed / totalQueueCount) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Failed Items List */}
          {errorQueueCount > 0 && (
            <div className="space-y-1.5 pt-1">
              {batchQueue
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
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery Thumbnail Cards (Committed Gallery Content) */}
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
