import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { ImageCrop } from '../types';
import { DEFAULT_IMAGE_CROP, getCropImageStyle, normalizeImageCrop } from '../utils/imageCrop';

export interface ImageCropModalProps {
  imageUrl: string;
  initialCrop?: ImageCrop | null;
  title: string;
  subtitle?: string;
  resetLabel?: string;
  uncroppedHint?: string;
  onSave: (crop: ImageCrop | undefined) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageUrl,
  initialCrop,
  title,
  subtitle = 'Original R2 photograph remains unedited',
  resetLabel = 'Reset to Original',
  uncroppedHint = 'Original uncropped presentation (default framing)',
  onSave,
  onCancel,
}) => {
  const [tempCrop, setTempCrop] = useState<ImageCrop | null>(() => {
    const normalized = normalizeImageCrop(initialCrop);
    return normalized ? { ...normalized } : { ...DEFAULT_IMAGE_CROP };
  });

  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !cropFrameRef.current) return;
    const rect = cropFrameRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = clientX - dragStartPosRef.current.x;
    const deltaY = clientY - dragStartPosRef.current.y;
    const pctX = (deltaX / rect.width) * 100;
    const pctY = (deltaY / rect.height) * 100;

    const clampedX = Math.max(-100, Math.min(100, initialOffsetRef.current.x + pctX));
    const clampedY = Math.max(-100, Math.min(100, initialOffsetRef.current.y + pctY));

    setTempCrop((prev) => ({
      zoom: prev?.zoom ?? 1.0,
      x: clampedX,
      y: clampedY,
    }));
  }, []);

  const endDrag = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Attach global mouse listeners while mounted so desktop drag stays smooth even outside frame bounds
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    };
    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        endDrag();
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [moveDrag, endDrag]);

  const startDrag = (clientX: number, clientY: number) => {
    if (!tempCrop) return;
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: clientX, y: clientY };
    initialOffsetRef.current = {
      x: tempCrop.x,
      y: tempCrop.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tempCrop) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1 && tempCrop) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1 && isDraggingRef.current) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    endDrag();
  };

  const handleSave = () => {
    if (tempCrop === null) {
      onSave(undefined);
      return;
    }
    onSave(normalizeImageCrop(tempCrop));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[#FBFBFA] border border-[#E5E3DB] shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 font-mono-archival">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-[#E5E3DB] pb-2">
          <div>
            <span className="font-semibold text-xs text-[#141413] uppercase tracking-wider block">
              {title}
            </span>
            <span className="text-[10px] text-[#8C8C82]">{subtitle}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:text-[#141413] text-[#8C8C82]"
            title="Close without saving"
            aria-label="Close crop editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4:3 Viewing Frame */}
        <div className="space-y-1">
          <div
            ref={cropFrameRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`w-full aspect-[4/3] bg-[#F4F3EE] border border-[#D5D3CB] relative overflow-hidden select-none touch-none ${
              tempCrop ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            {tempCrop ? (
              <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
                  style={getCropImageStyle(tempCrop)}
                />
                {/* 3x3 Composition Grid */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-[#141413]/15">
                  <div className="border-r border-b border-[#141413]/15" />
                  <div className="border-r border-b border-[#141413]/15" />
                  <div className="border-b border-[#141413]/15" />
                  <div className="border-r border-b border-[#141413]/15" />
                  <div className="border-r border-b border-[#141413]/15" />
                  <div className="border-b border-[#141413]/15" />
                  <div className="border-r border-[#141413]/15" />
                  <div className="border-r border-[#141413]/15" />
                  <div />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                <img
                  src={imageUrl}
                  alt="Original uncropped preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-2 select-none pointer-events-none opacity-90"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8C8C82] pt-0.5">
            <span>
              {tempCrop ? 'Drag image to reposition framing' : uncroppedHint}
            </span>
            {tempCrop && (
              <span className="text-[#141413] font-semibold">
                X: {Math.round(tempCrop.x)}% • Y: {Math.round(tempCrop.y)}%
              </span>
            )}
          </div>
        </div>

        {/* Controls: Zoom Slider & Center Button */}
        <div className="space-y-3 bg-[#F4F3EE] p-3 border border-[#E5E3DB]">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#141413] font-semibold">
                Zoom: {tempCrop ? `${tempCrop.zoom.toFixed(2)}x` : '1.00x (Original)'}
              </span>
              {tempCrop && (
                <button
                  type="button"
                  onClick={() => setTempCrop((prev) => ({ zoom: prev?.zoom ?? 1.0, x: 0, y: 0 }))}
                  className="text-[10px] text-[#6E6E66] hover:text-[#141413] underline"
                >
                  Center
                </button>
              )}
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={tempCrop ? tempCrop.zoom : 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTempCrop((prev) => ({
                  zoom: val,
                  x: prev?.x ?? 0,
                  y: prev?.y ?? 0,
                }));
              }}
              className="w-full accent-[#9E2A2B] cursor-pointer"
              aria-label="Zoom"
            />
            <div className="flex justify-between text-[9px] text-[#8C8C82] mt-0.5">
              <span>1.0x (Standard)</span>
              <span>2.0x</span>
              <span>3.0x (Max)</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E3DB]">
          <button
            type="button"
            onClick={() => setTempCrop(null)}
            className={`text-xs px-2.5 py-1 border transition-colors ${
              tempCrop === null
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413]'
                : 'border-[#E5E3DB] text-[#6E6E66] hover:bg-[#EAE8E0] hover:text-[#141413]'
            }`}
            title="Restore original uncropped presentation"
          >
            {resetLabel}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 border border-[#E5E3DB] text-[#6E6E66] hover:bg-[#EAE8E0] hover:text-[#141413] text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1 bg-[#141413] text-[#FBFBFA] hover:bg-[#2C2C28] text-xs font-medium"
            >
              Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
