import React, { useState, useRef } from 'react';
import { Upload, Link2, Image as ImageIcon, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface DualImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  category?: string;
  onToast?: (msg: string) => void;
  presets?: { name: string; url: string }[];
  className?: string;
}

export const DualImageUploader: React.FC<DualImageUploaderProps> = ({
  value,
  onChange,
  label = 'Question Diagram / Visual Asset',
  presets = [
    { name: 'Resistor Circuit', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
    { name: 'Prism & Optics', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80' },
    { name: 'Geometry Triangle', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80' },
    { name: 'Cell Structure', url: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=800&auto=format&fit=crop&q=80' },
  ],
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid JPG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            base64Data,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          onChange(data.url);
        } else {
          const err = await res.json();
          setUploadError(err.error || 'Failed to upload image to institutional storage.');
        }
      } catch (err) {
        console.error('Upload failed:', err);
        setUploadError('Network error uploading image.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Could not read image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`space-y-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors ${className}`}>
      {/* Header and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload JPG/PNG File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Paste Web Link</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          {uploadError}
        </div>
      )}

      {/* Tab 1: Upload Image File (JPG/PNG) */}
      {activeTab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-slate-900/80 rounded-xl p-4 text-center cursor-pointer transition-colors group"
          >
            {uploading ? (
              <div className="flex flex-col items-center justify-center py-2 gap-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                <span className="text-xs font-semibold">Processing & uploading image to storage...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1 gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Click to select or drop a JPG/PNG image file
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Supports JPG, JPEG, PNG, or WebP up to 5MB
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Paste Web Link */}
      {activeTab === 'link' && (
        <div className="space-y-2">
          <div className="relative">
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="url"
              placeholder="https://example.com/diagram.jpg"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {presets && presets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Sample Presets:
              </span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className="text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview with Clear / Remove Option */}
      {value && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={value}
              alt="Diagram Preview"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shadow-xs shrink-0"
            />
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Image attached
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                {value}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
};
