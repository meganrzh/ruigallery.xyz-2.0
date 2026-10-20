import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Loader2,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { api } from '../services/api';

export interface ImageUploaderFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  alt?: string;
  onAltChange?: (alt: string) => void;
  scanInfo?: string;
  onScanInfoChange?: (scanInfo: string) => void;
  placeholder?: string;
}

export const ImageUploaderField: React.FC<ImageUploaderFieldProps> = ({
  value,
  onChange,
  caption,
  onCaptionChange,
  alt,
  onAltChange,
  scanInfo,
  onScanInfoChange,
  placeholder = 'https://... or upload an archival image file',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>(() => {
    if (value && !value.startsWith('/api/media/')) return 'url';
    return 'upload';
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFile = async (file: File) => {
    setUploadError(null);

    // Client-side pre-validation
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed size is 10 MB.`
      );
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) {
      setUploadError(
        'HEIC/HEIF format is not natively supported by all web browsers. Please convert your photo to JPEG, PNG, or WebP before uploading.'
      );
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadMedia(file);
      onChange(res.url);
      setUploadError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const isR2Media = value.startsWith('/api/media/');

  return (
    <div className="space-y-3 font-mono-archival text-xs">
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Mode selection buttons */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E5E3DB] pb-2">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setUploadError(null);
            }}
            className={`px-2.5 py-1 text-[11px] flex items-center space-x-1.5 border transition-colors ${
              mode === 'upload'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('url');
              setUploadError(null);
            }}
            className={`px-2.5 py-1 text-[11px] flex items-center space-x-1.5 border transition-colors ${
              mode === 'url'
                ? 'bg-[#141413] text-[#FBFBFA] border-[#141413] font-medium'
                : 'bg-[#FBFBFA] text-[#6E6E66] border-[#E5E3DB] hover:border-[#141413]'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>External Image URL</span>
          </button>
        </div>

        {value && (
          <span className="text-[10px] text-[#8C8C82] uppercase tracking-wider">
            {isR2Media ? 'R2 Archival Storage' : 'External Link'}
          </span>
        )}
      </div>

      {/* Upload Dropzone */}
      {mode === 'upload' && !value && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-[#9E2A2B] bg-[#9E2A2B]/5'
              : 'border-[#D5D3CA] hover:border-[#141413] bg-[#FBFBFA]'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 py-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#9E2A2B]" />
              <span className="text-xs text-[#141413] font-medium">
                Uploading to Cloudflare R2 media storage...
              </span>
              <span className="text-[10px] text-[#8C8C82]">
                Validating image bytes and creating archival key
              </span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#EAE8E0] flex items-center justify-center text-[#141413] mb-1">
                <Upload className="w-5 h-5 text-[#9E2A2B]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#141413] block">
                  Click to choose image or drag and drop here
                </span>
                <span className="text-[10px] text-[#8C8C82] block mt-0.5">
                  JPEG, PNG, WebP, GIF, or AVIF (Max 10 MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* External URL Input */}
      {mode === 'url' && !value && (
        <div className="space-y-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2.5 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#141413] focus:border-[#141413]"
          />
          <span className="text-[10px] text-[#8C8C82] block">
            Paste any direct HTTPS image link (Unsplash, Museum archives, Wikimedia, etc.)
          </span>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold block">Upload Failed</span>
            <span className="text-[11px]">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-500 hover:text-red-800 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Populated Image Preview & Controls */}
      {value && (
        <div className="border border-[#E5E3DB] bg-[#F4F3EE] p-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-20 h-20 bg-[#EAE8E0] border border-[#E5E3DB] overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={value}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase ${
                      isR2Media
                        ? 'bg-[#141413] text-[#FBFBFA]'
                        : 'bg-[#E5E3DB] text-[#4A4A44]'
                    }`}
                  >
                    {isR2Media ? 'R2 Archival Storage' : 'External URL'}
                  </span>
                </div>
                <div
                  className="text-[11px] text-[#141413] font-mono-archival break-all line-clamp-2"
                  title={value}
                >
                  {value}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1 text-[11px] border border-[#E5E3DB] bg-[#FBFBFA] hover:border-[#141413] text-[#141413] transition-colors flex items-center space-x-1"
                title="Upload a new image to replace current"
              >
                <Upload className="w-3 h-3 text-[#9E2A2B]" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setUploadError(null);
                }}
                className="px-2.5 py-1 text-[11px] border border-[#E5E3DB] bg-[#FBFBFA] hover:border-red-400 hover:text-red-700 text-[#6E6E66] transition-colors flex items-center space-x-1"
                title="Clear image"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Fields */}
      {(onCaptionChange || onAltChange || onScanInfoChange) && (
        <div className="space-y-2 pt-2 border-t border-[#EFEFEA]">
          {onCaptionChange && (
            <div>
              <label className="block text-[#8C8C82] text-[10px] uppercase mb-0.5">
                Archival Caption
              </label>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder="e.g. Fig 1.1 — Photographic record of catalog schema..."
                className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-serif text-[#141413]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {onAltChange && (
              <div>
                <label className="block text-[#8C8C82] text-[10px] uppercase mb-0.5">
                  Accessibility Alt Text
                </label>
                <input
                  type="text"
                  value={alt || ''}
                  onChange={(e) => onAltChange(e.target.value)}
                  placeholder="e.g. Detailed black and white close-up of handwritten notes"
                  className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-serif text-[#141413]"
                />
              </div>
            )}

            {onScanInfoChange && (
              <div>
                <label className="block text-[#8C8C82] text-[10px] uppercase mb-0.5">
                  Scan / Plate Identifier
                </label>
                <input
                  type="text"
                  value={scanInfo || ''}
                  onChange={(e) => onScanInfoChange(e.target.value)}
                  placeholder="e.g. Plate #04 / 2400 DPI archival scan"
                  className="w-full p-2 bg-[#FBFBFA] border border-[#E5E3DB] text-xs font-mono-archival text-[#141413]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
