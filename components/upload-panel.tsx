"use client";

import { useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, FileUp, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/upload";
import { cn } from "@/lib/utils";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

function rejectionMessage(rejection: FileRejection): string {
  const code = rejection.errors[0]?.code;
  if (code === "file-too-large") return "File is too large (max 4 MB)";
  if (code === "file-invalid-type") return "Upload a PDF, PNG, JPEG or WebP file";
  return "That file can't be used";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPanel({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  // Choosing a file only selects it; analysis starts when the user confirms.
  const [selected, setSelected] = useState<File | null>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
    disabled,
    onDropAccepted: ([file]) => {
      setError(null);
      setSelected(file);
    },
    onDropRejected: ([rejection]) => {
      setSelected(null);
      setError(rejectionMessage(rejection));
    },
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card px-6 py-12 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
          isDragActive && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        {/* react-dropzone's hidden input style differs slightly between server and client render. */}
        <input {...getInputProps()} data-testid="upload-input" suppressHydrationWarning />
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <FileUp className="size-6" aria-hidden />
        </div>
        <div>
          <p className="font-medium">
            {isDragActive
              ? "Drop your report here"
              : selected
                ? "Drop or click to choose a different file"
                : "Drop your report here, or click to choose"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, PNG, JPEG or WebP · up to 4 MB</p>
        </div>
      </div>
      {selected && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <FileText className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selected.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto sm:ml-0"
              onClick={() => setSelected(null)}
              aria-label={`Remove ${selected.name}`}
              disabled={disabled}
            >
              <X aria-hidden />
            </Button>
          </div>
          <Button size="lg" onClick={() => onFile(selected)} disabled={disabled}>
            <Sparkles aria-hidden />
            Analyze report
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
