import React, { useLayoutEffect, useRef, useState } from 'react';
import type { ImageCrop } from '../types';
import {
  CROP_FRAME_ASPECT,
  computeRenderedCropLayout,
  getRenderedCropImgStyle,
  type ImageDimensions,
} from '../utils/imageCrop';

export interface CroppedImageProps {
  src: string;
  alt: string;
  crop: ImageCrop;
  referenceAspect?: number;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * Renders a non-destructive ImageCrop using the image's true intrinsic dimensions
 * (`naturalWidth` / `naturalHeight`) rather than CSS `object-fit: cover` clipping.
 *
 * The full original image is sized to its true cover-scaled dimensions and translated
 * relative to the container's overflow-hidden viewport so saved crops accurately match
 * the crop editor composition and never expose unintended blank space.
 */
export const CroppedImage: React.FC<CroppedImageProps> = ({
  src,
  alt,
  crop,
  referenceAspect = CROP_FRAME_ASPECT,
  className = '',
  imgClassName = '',
  loading,
  referrerPolicy = 'no-referrer',
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [containerSize, setContainerSize] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<ImageDimensions | null>(null);

  // Track container dimensions responsively
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const nextWidth = rect.width;
      const nextHeight = rect.height;
      setContainerSize((prev) =>
        Math.abs(prev.width - nextWidth) < 0.5 && Math.abs(prev.height - nextHeight) < 0.5
          ? prev
          : { width: nextWidth, height: nextHeight }
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

  // Reset natural dimensions on src change and immediately read cached images
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    } else {
      setNaturalSize(null);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  const isReady =
    naturalSize !== null &&
    naturalSize.width > 0 &&
    naturalSize.height > 0 &&
    containerSize.width > 0 &&
    containerSize.height > 0;

  const layout = isReady
    ? computeRenderedCropLayout(
        crop,
        containerSize.width,
        containerSize.height,
        naturalSize.width,
        naturalSize.height,
        referenceAspect
      )
    : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        referrerPolicy={referrerPolicy}
        draggable={false}
        onLoad={handleLoad}
        onError={onError}
        className={`select-none pointer-events-none ${
          layout ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        style={
          layout
            ? getRenderedCropImgStyle(layout)
            : {
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '100%',
                height: '100%',
                transform: 'translate(-50%, -50%)',
                objectFit: 'cover',
              }
        }
      />
    </div>
  );
};
