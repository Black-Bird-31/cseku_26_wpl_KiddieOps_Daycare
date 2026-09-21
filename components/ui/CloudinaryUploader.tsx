"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, CheckCircle, Sparkles, AlertCircle } from "lucide-react";

interface CloudinaryUploaderProps {
  onUploadSuccess: (result: { assetId: string; secureUrl: string; publicId: string; resourceType?: "image" | "video" | "raw" }) => void;
  currentImageUrl?: string;
  label?: string;
  folder?: string;
  entityType?: string;
  allowVideo?: boolean;
}

export default function CloudinaryUploader({
  onUploadSuccess,
  currentImageUrl,
  label = "Upload Photo or Video (Cloudinary CDN)",
  folder = "kiddieops/children",
  entityType = "child_avatar",
  allowVideo = false,
}: CloudinaryUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoPreview = (url?: string | null) =>
    !!url && (url.startsWith("data:video") || url.includes(".mp4") || url.includes(".webm"));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = allowVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(allowVideo ? "File size exceeds 50MB limit." : "Image size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPreview(base64Data);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64Data,
            folder,
            entityType,
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to upload image");
        }

        setUploadSuccess(true);
        onUploadSuccess({
          assetId: data.assetId,
          secureUrl: data.secureUrl,
          publicId: data.publicId,
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        setError(err.message || "Failed to upload image to Cloudinary");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectPresetAvatar = async (url: string) => {
    setPreview(url);
    setIsUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUri: url,
          folder,
          entityType,
        }),
      });
      const data = await response.json();
      setUploadSuccess(true);
      onUploadSuccess({
        assetId: data.assetId || "media-preset",
        secureUrl: data.secureUrl || url,
        publicId: data.publicId || "preset_avatar",
      });
    } catch (err: any) {
      setError("Preset upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-700 block">
        {label}
      </label>

      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 transition-colors">
        {/* Avatar / Media Preview */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs flex-shrink-0 flex items-center justify-center">
          {preview ? (
            isVideoPreview(preview) ? (
              <video src={preview} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            ) : (
              <img src={preview} alt="Uploaded preview" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center p-2">
              <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
              <span className="text-[10px] text-slate-400 block font-medium">No Media</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-1">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] text-blue-700 font-bold">Uploading</span>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {preview ? (allowVideo ? "Change File" : "Change Photo") : (allowVideo ? "Upload Photo / Video" : "Upload Photo")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowVideo ? "image/*,video/*" : "image/*"}
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-xs text-slate-400">
              {allowVideo ? "JPG, PNG, MP4 up to 50MB" : "JPG, PNG up to 10MB"}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[11px] text-slate-500 font-medium">Samples:</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "Girl", url: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80" },
                { label: "Boy", url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80" },
                ...(allowVideo
                  ? [{ label: "Video Moment", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" }]
                  : [{ label: "Toddler", url: "https://images.unsplash.com/photo-1595454223600-91fbdd77e6e3?auto=format&fit=crop&w=400&q=80" }]),
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPresetAvatar(preset.url)}
                  className="w-6 h-6 rounded-md overflow-hidden border border-slate-300 hover:border-blue-500 transition-all hover:scale-110"
                  title={`Select ${preset.label}`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Uploaded & Synced with Cloudinary CDN
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
