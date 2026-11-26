import type React from 'react';
import type { ImageCrop } from '../types';

export const DEFAULT_IMAGE_CROP: ImageCrop = {
  zoom: 1.0,
  x: 0,
  y: 0,
};

/**
 * Validates and clamps an arbitrary crop payload into a safe ImageCrop object.
 * Returns undefined if null, undefined, or malformed.
 */
export function normalizeImageCrop(raw: unknown): ImageCrop | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as Record<string, unknown>;
  const zoom = typeof candidate.zoom === 'number' ? candidate.zoom : Number(candidate.zoom);
  const x = typeof candidate.x === 'number' ? candidate.x : Number(candidate.x);
  const y = typeof candidate.y === 'number' ? candidate.y : Number(candidate.y);

  if (!Number.isFinite(zoom) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return undefined;
  }

  return {
    zoom: Number(Math.max(1.0, Math.min(3.0, zoom)).toFixed(2)),
    x: Math.round(Math.max(-100, Math.min(100, x))),
    y: Math.round(Math.max(-100, Math.min(100, y))),
  };
}

/**
 * Computes inline CSS transform style for rendering a non-destructive ImageCrop.
 * Must be paired with an overflow-hidden frame and `object-cover` on the <img>.
 */
export function getCropImageStyle(crop: ImageCrop): React.CSSProperties {
  return {
    transform: `translate(${crop.x}%, ${crop.y}%) scale(${crop.zoom})`,
    transformOrigin: 'center center',
  };
}

/**
 * Formats a concise badge string describing an active custom crop.
 */
export function formatCropLabel(crop: ImageCrop): string {
  const formattedZoom = Number(crop.zoom.toFixed(2)).toString();
  return `${formattedZoom}x CROP`;
}
