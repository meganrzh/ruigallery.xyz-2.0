import type React from 'react';
import type { ImageCrop } from '../types';

/**
 * Canonical crop authoring frame aspect ratio (4:3) shared by both
 * Photo Gallery slideshow crops and Entry featured cover image crops.
 */
export const CROP_FRAME_ASPECT = 4 / 3;
export const MIN_CROP_ZOOM = 1.0;
export const MAX_CROP_ZOOM = 3.0;
export const MAX_STORED_OFFSET_PCT = 1000;

export const DEFAULT_IMAGE_CROP: ImageCrop = {
  zoom: 1.0,
  x: 0,
  y: 0,
};

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropFrameMetrics {
  /** Minimum uniform scale needed so the full image covers the crop frame with no blank space */
  minScale: number;
  /** Active uniform scale = minScale * zoom */
  scale: number;
  /** Rendered width (px) of the full unclipped image */
  scaledWidth: number;
  /** Rendered height (px) of the full unclipped image */
  scaledHeight: number;
  /** Maximum valid horizontal translation (px) from center before an image edge enters the frame */
  maxOffsetPxX: number;
  /** Maximum valid vertical translation (px) from center before an image edge enters the frame */
  maxOffsetPxY: number;
  /** Maximum valid horizontal translation expressed as % of frame width */
  maxOffsetPctX: number;
  /** Maximum valid vertical translation expressed as % of frame height */
  maxOffsetPctY: number;
}

export interface CropFocalPoint {
  /** Normalized horizontal coordinate [0..1] on the original image placed at the frame center */
  focalX: number;
  /** Normalized vertical coordinate [0..1] on the original image placed at the frame center */
  focalY: number;
}

export interface RenderedCropLayout {
  /** Full unclipped rendered image width in px */
  width: number;
  /** Full unclipped rendered image height in px */
  height: number;
  /** Clamped horizontal center translation in px (+ moves image right) */
  offsetX: number;
  /** Clamped vertical center translation in px (+ moves image down) */
  offsetY: number;
  /** Maximum valid horizontal pixel translation for this container */
  maxOffsetX: number;
  /** Maximum valid vertical pixel translation for this container */
  maxOffsetY: number;
  /** Crop values clamped to valid bounds of the reference frame */
  clampedCrop: ImageCrop;
  /** Authored focal point on the original image [0..1] */
  focalX: number;
  focalY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Validates and clamps an arbitrary crop payload into a safe ImageCrop object.
 * Preserves the `{ zoom, x, y }` schema where:
 * - `zoom` is the multiplier relative to cover-fit minimum scale (1.0..3.0)
 * - `x`, `y` are image-center translations relative to the 4:3 crop frame center,
 *   expressed as percentages of crop frame width/height.
 *
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
    zoom: round2(clamp(zoom, MIN_CROP_ZOOM, MAX_CROP_ZOOM)),
    x: round2(clamp(x, -MAX_STORED_OFFSET_PCT, MAX_STORED_OFFSET_PCT)),
    y: round2(clamp(y, -MAX_STORED_OFFSET_PCT, MAX_STORED_OFFSET_PCT)),
  };
}

/**
 * Computes true cover-fit dimensions and exact edge-to-edge drag bounds
 * for an image of `(naturalWidth, naturalHeight)` inside a frame of `(frameWidth, frameHeight)`.
 */
export function computeCropFrameMetrics(
  frameWidth: number,
  frameHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  zoom: number
): CropFrameMetrics {
  const safeZoom = clamp(Number.isFinite(zoom) ? zoom : MIN_CROP_ZOOM, MIN_CROP_ZOOM, MAX_CROP_ZOOM);

  if (frameWidth <= 0 || frameHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return {
      minScale: 1,
      scale: safeZoom,
      scaledWidth: Math.max(0, frameWidth),
      scaledHeight: Math.max(0, frameHeight),
      maxOffsetPxX: 0,
      maxOffsetPxY: 0,
      maxOffsetPctX: 0,
      maxOffsetPctY: 0,
    };
  }

  const minScale = Math.max(frameWidth / naturalWidth, frameHeight / naturalHeight);
  const scale = minScale * safeZoom;
  const scaledWidth = naturalWidth * scale;
  const scaledHeight = naturalHeight * scale;

  // Allow full edge reach while never letting an image edge cross inside the crop frame
  const maxOffsetPxX = Math.max(0, (scaledWidth - frameWidth) / 2);
  const maxOffsetPxY = Math.max(0, (scaledHeight - frameHeight) / 2);
  const maxOffsetPctX = (maxOffsetPxX / frameWidth) * 100;
  const maxOffsetPctY = (maxOffsetPxY / frameHeight) * 100;

  return {
    minScale,
    scale,
    scaledWidth,
    scaledHeight,
    maxOffsetPxX,
    maxOffsetPxY,
    maxOffsetPctX,
    maxOffsetPctY,
  };
}

/**
 * Clamps `{ zoom, x, y }` strictly within the true geometric bounds for a given frame and natural image size.
 */
export function clampCropToFrame(
  crop: ImageCrop,
  frameWidth: number,
  frameHeight: number,
  naturalWidth: number,
  naturalHeight: number
): ImageCrop {
  const safeZoom = clamp(crop.zoom, MIN_CROP_ZOOM, MAX_CROP_ZOOM);
  const metrics = computeCropFrameMetrics(
    frameWidth,
    frameHeight,
    naturalWidth,
    naturalHeight,
    safeZoom
  );

  return {
    zoom: safeZoom,
    x: clamp(crop.x, -metrics.maxOffsetPctX, metrics.maxOffsetPctX),
    y: clamp(crop.y, -metrics.maxOffsetPctY, metrics.maxOffsetPctY),
  };
}

/**
 * Updates zoom while keeping the currently centered image focal point anchored
 * in the middle of the crop frame, clamped cleanly to the new zoom's valid bounds.
 */
export function zoomCropPreservingFocus(
  currentCrop: ImageCrop,
  nextZoom: number,
  frameWidth: number,
  frameHeight: number,
  naturalWidth: number,
  naturalHeight: number
): ImageCrop {
  const safeNextZoom = clamp(nextZoom, MIN_CROP_ZOOM, MAX_CROP_ZOOM);
  if (frameWidth <= 0 || frameHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
    return {
      zoom: safeNextZoom,
      x: currentCrop.x,
      y: currentCrop.y,
    };
  }

  const prevClamped = clampCropToFrame(
    currentCrop,
    frameWidth,
    frameHeight,
    naturalWidth,
    naturalHeight
  );
  const prevMetrics = computeCropFrameMetrics(
    frameWidth,
    frameHeight,
    naturalWidth,
    naturalHeight,
    prevClamped.zoom
  );

  const prevOffsetPxX = (prevClamped.x / 100) * frameWidth;
  const prevOffsetPxY = (prevClamped.y / 100) * frameHeight;
  const focalX = 0.5 - prevOffsetPxX / prevMetrics.scaledWidth;
  const focalY = 0.5 - prevOffsetPxY / prevMetrics.scaledHeight;

  const nextMetrics = computeCropFrameMetrics(
    frameWidth,
    frameHeight,
    naturalWidth,
    naturalHeight,
    safeNextZoom
  );

  const desiredOffsetPxX = (0.5 - focalX) * nextMetrics.scaledWidth;
  const desiredOffsetPxY = (0.5 - focalY) * nextMetrics.scaledHeight;

  const nextX = (desiredOffsetPxX / frameWidth) * 100;
  const nextY = (desiredOffsetPxY / frameHeight) * 100;

  return {
    zoom: safeNextZoom,
    x: clamp(nextX, -nextMetrics.maxOffsetPctX, nextMetrics.maxOffsetPctX),
    y: clamp(nextY, -nextMetrics.maxOffsetPctY, nextMetrics.maxOffsetPctY),
  };
}

/**
 * Resolves the normalized `[0..1]` focal point on the original image that sits at the
 * center of the authored reference crop frame (default 4:3).
 */
export function computeCropFocalPoint(
  crop: ImageCrop,
  naturalWidth: number,
  naturalHeight: number,
  referenceAspect: number = CROP_FRAME_ASPECT
): CropFocalPoint {
  if (naturalWidth <= 0 || naturalHeight <= 0 || referenceAspect <= 0) {
    return { focalX: 0.5, focalY: 0.5 };
  }

  const refWidth = referenceAspect;
  const refHeight = 1;
  const clamped = clampCropToFrame(crop, refWidth, refHeight, naturalWidth, naturalHeight);
  const refMetrics = computeCropFrameMetrics(
    refWidth,
    refHeight,
    naturalWidth,
    naturalHeight,
    clamped.zoom
  );

  const refOffsetX = (clamped.x / 100) * refWidth;
  const refOffsetY = (clamped.y / 100) * refHeight;

  return {
    focalX: clamp(0.5 - refOffsetX / refMetrics.scaledWidth, 0, 1),
    focalY: clamp(0.5 - refOffsetY / refMetrics.scaledHeight, 0, 1),
  };
}

/**
 * Computes exact unclipped `<img>` geometry for rendering a saved `{ zoom, x, y }` crop
 * inside any target container `(containerWidth, containerHeight)`.
 *
 * - When the container matches `referenceAspect` (4:3), this reproduces the editor composition 1:1.
 * - When a public surface uses a different aspect ratio, this preserves the authored focal point
 *   at the requested zoom level while guaranteeing zero blank margins.
 */
export function computeRenderedCropLayout(
  crop: ImageCrop,
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  referenceAspect: number = CROP_FRAME_ASPECT
): RenderedCropLayout {
  const refWidth = referenceAspect > 0 ? referenceAspect : CROP_FRAME_ASPECT;
  const refHeight = 1;
  const clampedCrop = clampCropToFrame(crop, refWidth, refHeight, naturalWidth, naturalHeight);
  const { focalX, focalY } = computeCropFocalPoint(
    clampedCrop,
    naturalWidth,
    naturalHeight,
    refWidth
  );

  const targetMetrics = computeCropFrameMetrics(
    containerWidth,
    containerHeight,
    naturalWidth,
    naturalHeight,
    clampedCrop.zoom
  );

  const desiredOffsetX = (0.5 - focalX) * targetMetrics.scaledWidth;
  const desiredOffsetY = (0.5 - focalY) * targetMetrics.scaledHeight;

  const offsetX = clamp(desiredOffsetX, -targetMetrics.maxOffsetPxX, targetMetrics.maxOffsetPxX);
  const offsetY = clamp(desiredOffsetY, -targetMetrics.maxOffsetPxY, targetMetrics.maxOffsetPxY);

  return {
    width: targetMetrics.scaledWidth,
    height: targetMetrics.scaledHeight,
    offsetX,
    offsetY,
    maxOffsetX: targetMetrics.maxOffsetPxX,
    maxOffsetY: targetMetrics.maxOffsetPxY,
    clampedCrop,
    focalX,
    focalY,
  };
}

/**
 * Produces exact CSS positioning styles for an unclipped `<img>` inside a `relative` frame.
 * Overrides Tailwind preflight `max-width: 100%; height: auto` so the full scaled image is never clipped.
 */
export function getRenderedCropImgStyle(layout: RenderedCropLayout): React.CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    transform: `translate3d(calc(-50% + ${layout.offsetX}px), calc(-50% + ${layout.offsetY}px), 0)`,
  };
}

/**
 * Formats a concise badge string describing an active custom crop.
 */
export function formatCropLabel(crop: ImageCrop): string {
  const formattedZoom = Number(crop.zoom.toFixed(2)).toString();
  return `${formattedZoom}x CROP`;
}
