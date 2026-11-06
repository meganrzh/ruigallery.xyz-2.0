import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryImage, GalleryDisplay } from '../types';

export interface GalleryRendererProps {
  images: GalleryImage[];
  display?: GalleryDisplay;
  className?: string;
}

export const GalleryRenderer: React.FC<GalleryRendererProps> = ({
  images,
  display = 'grid',
  className = '',
}) => {
  const validImages = (images || []).filter(
    (img) => img && typeof img.url === 'string' && img.url.trim() !== ''
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep currentIndex bounded if images change
  useEffect(() => {
    if (currentIndex >= validImages.length && validImages.length > 0) {
      setCurrentIndex(validImages.length - 1);
    }
  }, [validImages.length, currentIndex]);

  const handlePrev = useCallback(() => {
    if (validImages.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  }, [validImages.length]);

  const handleNext = useCallback(() => {
    if (validImages.length <= 1) return;
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  }, [validImages.length]);

  // Keyboard navigation when slideshow container or child has focus or is hovered
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Touch / swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 40) {
      handlePrev();
    } else if (diff < -40) {
      handleNext();
    }
    touchStartX.current = null;
  };

  if (validImages.length === 0) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // SLIDESHOW PRESENTATION
  // ---------------------------------------------------------------------------
  if (display === 'slideshow') {
    const active = validImages[currentIndex] || validImages[0];

    return (
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`space-y-3 focus:outline-none focus:ring-1 focus:ring-[#141413]/30 ${className}`}
        aria-label="Photographic sequence. Use left and right arrow keys to navigate."
      >
        {/* Single uncropped photograph display */}
        <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-3 sm:p-6 flex items-center justify-center min-h-[260px] sm:min-h-[440px] max-h-[76vh] overflow-hidden">
          <img
            key={active.url}
            src={active.url}
            alt={active.alt || `Photograph ${currentIndex + 1} of ${validImages.length}`}
            referrerPolicy="no-referrer"
            className="w-auto max-w-full h-auto max-h-[70vh] object-contain mx-auto select-none"
          />
        </div>

        {/* Subdued Control & Caption Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 pt-1 border-t border-[#EFEFEA]">
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={validImages.length <= 1}
              className="p-1.5 border border-[#E5E3DB] bg-[#FBFBFA] hover:border-[#141413] hover:text-[#141413] text-[#6E6E66] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous photograph"
              title="Previous photograph (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={validImages.length <= 1}
              className="p-1.5 border border-[#E5E3DB] bg-[#FBFBFA] hover:border-[#141413] hover:text-[#141413] text-[#6E6E66] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next photograph"
              title="Next photograph (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-mono-archival text-xs text-[#8C8C82] tracking-wider pl-1.5 select-none">
              {currentIndex + 1} / {validImages.length}
            </span>
          </div>

          {active.caption && (
            <figcaption className="text-xs font-mono-archival text-[#6E6E66] italic leading-normal text-left sm:text-right max-w-xl">
              {active.caption}
            </figcaption>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GRID PRESENTATION (Default)
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start ${className}`}
    >
      {validImages.map((img, idx) => (
        <figure key={`${img.url}-${idx}`} className="space-y-2">
          {/* Uncropped plate: natural aspect ratio preserved */}
          <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-2 flex items-center justify-center">
            <img
              src={img.url}
              alt={img.alt || `Photograph ${idx + 1} of ${validImages.length}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-auto object-contain max-h-[640px]"
            />
          </div>
          {img.caption && (
            <figcaption className="text-[11px] font-mono-archival text-[#6E6E66] italic leading-normal px-0.5">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
};
