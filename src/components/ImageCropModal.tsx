import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { ImageCrop } from '../types';
import {
  CROP_FRAME_ASPECT,
  DEFAULT_IMAGE_CROP,
  clampCropToFrame,
  computeCropFrameMetrics,
  normalizeImageCrop,
  zoomCropPreservingFocus,
  type ImageDimensions,
} from '../utils/imageCrop';

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

/**
 * Computes the largest exact 4:3 crop frame that fits inside the editing stage
 * while leaving visible surrounding dimmed workspace on all four sides.
 */
function computeStageCropFrame(stageWidth: number, stageHeight: number): ImageDimensions {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const maxW = stageWidth * 0.76;
  const maxH = stageHeight * 0.72;

  let width = maxW;
  let height = width / CROP_FRAME_ASPECT;
  if (height > maxH) {
    height = maxH;
    width = height * CROP_FRAME_ASPECT;
  }

  return { width, height };
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

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [stageSize, setStageSize] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<ImageDimensions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const backdropMouseDownRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const dragZoomRef = useRef(1.0);

  // Measure the editing workspace stage responsively
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setStageSize((prev) =>
        Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
          ? prev
          : { width: rect.width, height: rect.height }
      );
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Reset image natural dimensions when URL changes, reading immediately if cached
  useLayoutEffect(() => {
    setLoadFailed(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    } else {
      setNaturalSize(null);
    }
  }, [imageUrl]);

  const cropFrame = useMemo(
    () => computeStageCropFrame(stageSize.width, stageSize.height),
    [stageSize.width, stageSize.height]
  );

  // Keep latest geometry in refs so drag handlers always use exact live bounds
  const cropFrameRef = useRef(cropFrame);
  cropFrameRef.current = cropFrame;
  const naturalSizeRef = useRef(naturalSize);
  naturalSizeRef.current = naturalSize;

  // Compute live metrics and clamped display state for the full unclipped image
  const liveGeometry = useMemo(() => {
    if (
      !tempCrop ||
      !naturalSize ||
      naturalSize.width <= 0 ||
      naturalSize.height <= 0 ||
      cropFrame.width <= 0 ||
      cropFrame.height <= 0
    ) {
      return null;
    }

    const clamped = clampCropToFrame(
      tempCrop,
      cropFrame.width,
      cropFrame.height,
      naturalSize.width,
      naturalSize.height
    );
    const metrics = computeCropFrameMetrics(
      cropFrame.width,
      cropFrame.height,
      naturalSize.width,
      naturalSize.height,
      clamped.zoom
    );

    const offsetPxX = (clamped.x / 100) * cropFrame.width;
    const offsetPxY = (clamped.y / 100) * cropFrame.height;

    return {
      clamped,
      metrics,
      offsetPxX,
      offsetPxY,
      canPanX: metrics.maxOffsetPxX > 0.5,
      canPanY: metrics.maxOffsetPxY > 0.5,
    };
  }, [tempCrop, naturalSize, cropFrame.width, cropFrame.height]);

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
    if (!isDraggingRef.current) return;
    const frame = cropFrameRef.current;
    const nat = naturalSizeRef.current;
    if (frame.width <= 0 || frame.height <= 0 || !nat || nat.width <= 0 || nat.height <= 0) {
      return;
    }

    const deltaX = clientX - dragStartPosRef.current.x;
    const deltaY = clientY - dragStartPosRef.current.y;
    const deltaPctX = (deltaX / frame.width) * 100;
    const deltaPctY = (deltaY / frame.height) * 100;

    const nextClamped = clampCropToFrame(
      {
        zoom: dragZoomRef.current,
        x: dragStartOffsetRef.current.x + deltaPctX,
        y: dragStartOffsetRef.current.y + deltaPctY,
      },
      frame.width,
      frame.height,
      nat.width,
      nat.height
    );

    setTempCrop(nextClamped);
  }, []);

  const endDrag = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  }, []);

  // Global mouse listeners so desktop dragging stays smooth even outside the workspace stage
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    };
    const handleWindowMouseUp = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [moveDrag, endDrag]);

  const startDrag = (clientX: number, clientY: number) => {
    if (!tempCrop || !liveGeometry) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartPosRef.current = { x: clientX, y: clientY };
    dragStartOffsetRef.current = {
      x: liveGeometry.clamped.x,
      y: liveGeometry.clamped.y,
    };
    dragZoomRef.current = liveGeometry.clamped.zoom;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!tempCrop || !liveGeometry) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1 && tempCrop && liveGeometry) {
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

  const handleZoomChange = (nextZoom: number) => {
    setTempCrop((prev) => {
      const base = prev ?? { ...DEFAULT_IMAGE_CROP };
      const frame = cropFrameRef.current;
      const nat = naturalSizeRef.current;
      if (frame.width > 0 && frame.height > 0 && nat && nat.width > 0 && nat.height > 0) {
        return zoomCropPreservingFocus(
          base,
          nextZoom,
          frame.width,
          frame.height,
          nat.width,
          nat.height
        );
      }
      return {
        zoom: nextZoom,
        x: base.x,
        y: base.y,
      };
    });
  };

  const handleSave = () => {
    if (tempCrop === null) {
      onSave(undefined);
      return;
    }

    const frame = cropFrameRef.current;
    const nat = naturalSizeRef.current;
    const finalCrop =
      frame.width > 0 && frame.height > 0 && nat && nat.width > 0 && nat.height > 0
        ? clampCropToFrame(tempCrop, frame.width, frame.height, nat.width, nat.height)
        : tempCrop;

    onSave(normalizeImageCrop(finalCrop));
  };

  const canDragAnyAxis = Boolean(liveGeometry && (liveGeometry.canPanX || liveGeometry.canPanY));

  const dragHintText = useMemo(() => {
    if (!tempCrop) return uncroppedHint;
    if (loadFailed) return 'Unable to load image dimensions for crop preview';
    if (!liveGeometry) return 'Measuring original image dimensions…';
    if (liveGeometry.canPanX && liveGeometry.canPanY) {
      return 'Drag image in any direction to reposition framing';
    }
    if (liveGeometry.canPanY) {
      return 'Drag vertically to reposition (zoom in to pan horizontally)';
    }
    if (liveGeometry.canPanX) {
      return 'Drag horizontally to reposition (zoom in to pan vertically)';
    }
    return 'Image matches 4:3 crop frame — zoom in to reposition';
  }, [tempCrop, loadFailed, liveGeometry, uncroppedHint]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#141413]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseDown={(e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget) {
          onCancel();
        }
        backdropMouseDownRef.current = false;
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[#FBFBFA] border border-[#E5E3DB] shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 font-mono-archival">
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

        {/* Interactive Full-Image Workspace with Fixed 4:3 Crop Frame & Dimmed Exterior */}
        <div className="space-y-1.5">
          <div
            ref={stageRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`w-full h-[290px] sm:h-[380px] bg-[#1C1C1A] border border-[#D5D3CB] relative overflow-hidden select-none touch-none ${
              tempCrop && canDragAnyAxis
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-default'
            }`}
          >
            {tempCrop ? (
              <>
                {/* Full Unclipped Original Image Layer */}
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                    }
                  }}
                  onError={() => setLoadFailed(true)}
                  className={`select-none pointer-events-none ${
                    liveGeometry ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={
                    liveGeometry
                      ? {
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: `${liveGeometry.metrics.scaledWidth}px`,
                          height: `${liveGeometry.metrics.scaledHeight}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          transform: `translate3d(calc(-50% + ${liveGeometry.offsetPxX}px), calc(-50% + ${liveGeometry.offsetPxY}px), 0)`,
                        }
                      : {
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxWidth: 'none',
                          maxHeight: 'none',
                        }
                  }
                />

                {/* Fixed 4:3 Crop Frame Cutout with Dimmed Exterior Mask & 3x3 Composition Grid */}
                {cropFrame.width > 0 && cropFrame.height > 0 && (
                  <div
                    data-crop-frame="true"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-[#FBFBFA]/90"
                    style={{
                      width: `${cropFrame.width}px`,
                      height: `${cropFrame.height}px`,
                      boxShadow: '0 0 0 9999px rgba(20, 20, 19, 0.62)',
                    }}
                  >
                    {/* 3x3 Rule-of-Thirds Composition Grid */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-[#FBFBFA]/25" />
                      <div className="border-r border-b border-[#FBFBFA]/25" />
                      <div className="border-b border-[#FBFBFA]/25" />
                      <div className="border-r border-b border-[#FBFBFA]/25" />
                      <div className="border-r border-b border-[#FBFBFA]/25" />
                      <div className="border-b border-[#FBFBFA]/25" />
                      <div className="border-r border-[#FBFBFA]/25" />
                      <div className="border-r border-[#FBFBFA]/25" />
                      <div />
                    </div>

                    {/* Subtle Archival Corner Reticles */}
                    <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-[#FBFBFA]" />
                    <span className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-[#FBFBFA]" />
                    <span className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-[#FBFBFA]" />
                    <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-[#FBFBFA]" />

                    {/* Frame Aspect Label */}
                    <span className="absolute -top-5 left-0 text-[9px] tracking-wider uppercase text-[#FBFBFA]/80">
                      4:3 CROP FRAME
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 bg-[#F4F3EE]">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Original uncropped preview"
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                    }
                  }}
                  className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8C8C82] pt-0.5">
            <span>{dragHintText}</span>
            <div className="flex items-center space-x-3">
              {naturalSize && (
                <span>
                  {naturalSize.width} × {naturalSize.height}px
                </span>
              )}
              {tempCrop && liveGeometry && (
                <span className="text-[#141413] font-semibold">
                  X: {Math.round(liveGeometry.clamped.x)}% • Y: {Math.round(liveGeometry.clamped.y)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls: Zoom Slider & Center Button */}
        <div className="space-y-3 bg-[#F4F3EE] p-3 border border-[#E5E3DB]">
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[#141413] font-semibold">
                Zoom: {tempCrop ? `${tempCrop.zoom.toFixed(2)}x` : '1.00x (Original)'}
              </span>
              {tempCrop ? (
                <button
                  type="button"
                  onClick={() =>
                    setTempCrop((prev) => ({ zoom: prev?.zoom ?? 1.0, x: 0, y: 0 }))
                  }
                  className="text-[10px] text-[#6E6E66] hover:text-[#141413] underline"
                >
                  Center
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTempCrop({ ...DEFAULT_IMAGE_CROP })}
                  className="text-[10px] text-[#9E2A2B] hover:text-[#141413] underline"
                >
                  Enable Custom Crop
                </button>
              )}
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={tempCrop ? tempCrop.zoom : 1.0}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-[#9E2A2B] cursor-pointer"
              aria-label="Zoom"
            />
            <div className="flex justify-between text-[9px] text-[#8C8C82] mt-0.5">
              <span>1.0x (Fill Frame)</span>
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
