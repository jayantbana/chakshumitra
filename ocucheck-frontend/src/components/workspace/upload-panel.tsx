"use client";
import { useCallback, useRef } from "react";
import {
  Upload,
  ImageIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ArrowRight,
  FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/features/upload/hooks/use-upload";
import { useSessionStore } from "@/store/session-store";
import Image from "next/image";

export function UploadPanel() {
  const {
    status,
    file,
    preview,
    imageId,
    progress,
    error,
    message,
    selectFile,
    upload,
    reset,
    setDragover,
  } = useUpload();

  const { activeProtocol } = useSessionStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) selectFile(dropped);
    },
    [selectFile, setDragover]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => setDragover(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  };

  const isLoading = status === "uploading" || status === "analyzing";
  const isDone = status === "success";
  const isError = status === "error";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">Image-assisted screening</p>
            <p className="text-xs text-text-faint">
              Upload a clear photo of the affected eye
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Drop zone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload eye image"
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "rounded-2xl border-2 border-dashed",
                "px-8 py-14 cursor-pointer",
                "transition-all duration-200",
                status === "dragover"
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border bg-surface hover:border-primary/40 hover:bg-surface-offset"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="sr-only"
                aria-hidden="true"
              />

              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors",
                  status === "dragover"
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-offset text-text-faint"
                )}
              >
                <Upload size={24} strokeWidth={1.5} />
              </div>

              <p className="text-sm font-semibold text-text mb-1.5">
                {status === "dragover"
                  ? "Drop the image here"
                  : "Drop an image or click to browse"}
              </p>
              <p className="text-xs text-text-muted text-center max-w-[28ch]">
                Supports JPEG, PNG, and WebP · Max 10 MB
              </p>
            </div>
          )}

          {/* Preview + actions */}
          {file && preview && (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              {/* Image preview */}
              <div className="relative w-full aspect-video bg-surface-offset">
                <Image
                  src={preview}
                  alt={`Preview of ${file.name}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 100vw, 640px"
                />
                {!isLoading && !isDone && (
                  <button
                    onClick={reset}
                    aria-label="Remove image"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg/80 backdrop-blur-sm border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* File info */}
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-border">
                <FileImage size={16} className="text-text-faint flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{file.name}</p>
                  <p className="text-xs text-text-faint">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
                {isDone && (
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                )}
              </div>

              {/* Progress bar */}
              {isLoading && (
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      {status === "uploading" ? "Uploading…" : "Processing image…"}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-offset rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success state */}
              {isDone && (
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl bg-success/10 border border-success/20 px-3.5 py-3">
                    <CheckCircle2 size={15} className="text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-success">Image uploaded</p>
                      <p className="text-xs text-success/70 mt-0.5">
                        {message ?? "The image has been processed and linked to your session."}
                      </p>
                      {imageId && (
                        <p className="text-xs text-text-faint mt-1 font-mono">
                          ID: {imageId}
                        </p>
                      )}
                    </div>
                  </div>

                  {activeProtocol && (
                    <p className="text-xs text-text-muted">
                      Active protocol: <span className="text-text font-medium">{activeProtocol}</span>. The image is now linked to this assessment session.
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={reset}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-text-muted hover:text-text hover:bg-surface-offset transition-colors"
                    >
                      Upload another
                    </button>
                  </div>
                </div>
              )}

              {/* Upload button */}
              {!isLoading && !isDone && (
                <div className="px-4 py-4">
                  <button
                    onClick={upload}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-text-inverse hover:bg-primary-hover active:bg-primary-active transition-colors"
                  >
                    <ImageIcon size={15} />
                    Analyze this image
                    <ArrowRight size={15} />
                  </button>
                  <p className="text-xs text-text-faint text-center mt-2.5">
                    The image will be linked to your current session
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {isError && error && (
            <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3.5">
              <AlertTriangle size={15} className="text-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">Upload failed</p>
                <p className="text-xs text-error/70 mt-0.5">{error}</p>
              </div>
              <button
                onClick={reset}
                aria-label="Dismiss error"
                className="text-error/50 hover:text-error transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Guidelines */}
          {!file && (
            <div className="rounded-xl border border-border bg-surface-offset px-4 py-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
                Photo guidelines
              </p>
              <ul className="space-y-1.5 text-xs text-text-muted">
                {[
                  "Use good, even lighting — avoid harsh shadows",
                  "Keep the eye fully open and looking forward",
                  "Hold the camera steady to avoid blur",
                  "Remove contact lenses if possible",
                  "Capture the affected eye clearly in frame",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-text-faint mt-1.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}