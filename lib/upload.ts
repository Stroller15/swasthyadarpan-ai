import { AppError } from "@/lib/errors";

// Vercel rejects serverless request bodies over 4.5 MB.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type UploadMediaType = "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

const startsWith = (data: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => data[offset + i] === byte);

/** Identifies the file from its leading bytes, ignoring the client-supplied name and type. */
function sniffMediaType(data: Uint8Array): UploadMediaType | null {
  if (startsWith(data, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(data, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp"; // RIFF....WEBP
  }
  return null;
}

export async function validateUpload(
  file: File | null,
): Promise<{ data: Uint8Array; mediaType: UploadMediaType }> {
  if (!file || file.size === 0) throw new AppError("INVALID_FILE");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("FILE_TOO_LARGE");

  const data = new Uint8Array(await file.arrayBuffer());
  const mediaType = sniffMediaType(data);
  if (!mediaType) throw new AppError("INVALID_FILE");
  return { data, mediaType };
}
