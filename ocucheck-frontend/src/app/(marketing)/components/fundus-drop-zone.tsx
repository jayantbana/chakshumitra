"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, FileImage } from "lucide-react";

type DropState = "idle" | "hover" | "analyzing" | "done";

export function FundusDropZone() {
  const [state, setState] = useState<DropState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setState("analyzing");
    setTimeout(() => setState("done"), 2200);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const reset = () => {
    setState("idle");
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <div
      className="card-elevated h-full min-h-[280px] flex flex-col relative overflow-hidden cursor-pointer"
      style={{
        border:
          state === "hover"
            ? "1px solid rgba(45,212,191,0.5)"
            : "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 200ms ease",
      }}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setState("hover"); }}
      onDragLeave={() => setState("idle")}
      onClick={() => state === "idle" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.dcm"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* IDLE */}
      {state === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.2)",
            }}
          >
            <FileImage size={24} color="#2dd4bf" />
          </div>
          <div className="text-center">
            <p
              className="font-semibold font-display text-base"
              style={{ color: "#f1f0ee" }}
            >
              Fundus Drop Zone
            </p>
            <p className="text-xs mt-1" style={{ color: "#8b8a87" }}>
              DICOM, JPG, PNG compatible
            </p>
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-full mt-1"
            style={{
              background: "rgba(45,212,191,0.06)",
              border: "1px solid rgba(45,212,191,0.15)",
              color: "#2dd4bf",
            }}
          >
            Drop image or click to upload
          </div>
        </div>
      )}

      {/* HOVER */}
      {state === "hover" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(45,212,191,0.15)",
              border: "1px solid rgba(45,212,191,0.4)",
            }}
          >
            <Upload size={24} color="#2dd4bf" />
          </div>
          <p className="font-semibold text-sm" style={{ color: "#2dd4bf" }}>
            Release to upload
          </p>
          <div className="rgb-line absolute bottom-0 inset-x-0" />
        </div>
      )}

      {/* ANALYZING */}
      {state === "analyzing" && preview && (
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 overflow-hidden rounded-t-xl">
            <img
              src={preview}
              alt="Fundus preview"
              className="w-full h-full object-cover"
              style={{ opacity: 0.6 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full animate-spin"
                style={{
                  border: "2px solid transparent",
                  borderTopColor: "#2dd4bf",
                  borderRightColor: "rgba(45,212,191,0.3)",
                }}
              />
              <div className="absolute">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: "#2dd4bf",
                    boxShadow: "0 0 10px #2dd4bf",
                  }}
                />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(14,15,17,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <X size={12} color="#8b8a87" />
            </button>
          </div>
          <div
            className="p-3 flex items-center gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="heartbeat-dot w-1.5 h-1.5 rounded-full"
                  style={{ background: "#2dd4bf" }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "#8b8a87" }}>
              Analyzing surface...
            </span>
          </div>
        </div>
      )}

      {/* DONE */}
      {state === "done" && preview && (
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 overflow-hidden rounded-t-xl">
            <img
              src={preview}
              alt="Fundus preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(14,15,17,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <X size={12} color="#8b8a87" />
            </button>
          </div>
          <div
            className="p-3 flex items-center gap-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <CheckCircle size={14} color="#22c55e" />
            <span className="text-xs" style={{ color: "#22c55e" }}>
              Analysis complete
            </span>
            <span
              className="text-xs ml-auto"
              style={{ color: "#4a4947" }}
            >
              {file?.name && file.name.length > 16
                ? file.name.slice(0, 16) + "…"
                : file?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}