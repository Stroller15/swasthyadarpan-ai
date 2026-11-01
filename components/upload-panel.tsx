"use client";

import { useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileUp } from "lucide-react";
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

export function UploadPanel({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_UPLOAD_BYTES,
    multiple: false,
    disabled,
    onDropAccepted: ([file]) => {
      setError(null);
      onFile(file);
    },
    onDropRejected: ([rejection]) => setError(rejectionMessage(rejection)),
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
        <input {...getInputProps()} data-testid="upload-input" />
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <FileUp className="size-6" aria-hidden />
        </div>
        <div>
          <p className="font-medium">{isDragActive ? "Drop your report here" : "Drop your report here, or click to choose"}</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, PNG, JPEG or WebP · up to 4 MB</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
