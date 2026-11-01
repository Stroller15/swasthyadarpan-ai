import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/upload";

const fileOf = (bytes: number[] | Uint8Array, name = "report.pdf", type = "application/pdf") =>
  new File([new Uint8Array(bytes)], name, { type });

const expectCode = async (promise: Promise<unknown>, code: string) => {
  await expect(promise).rejects.toMatchObject({ code });
};

describe("validateUpload", () => {
  it("rejects a missing file", async () => {
    await expectCode(validateUpload(null), "INVALID_FILE");
  });

  it("rejects an empty file", async () => {
    await expectCode(validateUpload(fileOf([])), "INVALID_FILE");
  });

  it("rejects files over 4 MB", async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
    await expectCode(validateUpload(fileOf(big)), "FILE_TOO_LARGE");
  });

  it("detects a PDF", async () => {
    const result = await validateUpload(fileOf([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]));
    expect(result.mediaType).toBe("application/pdf");
    expect(result.data).toBeInstanceOf(Uint8Array);
  });

  it("detects a PNG", async () => {
    const result = await validateUpload(fileOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0], "a.png", "image/png"));
    expect(result.mediaType).toBe("image/png");
  });

  it("detects a JPEG", async () => {
    const result = await validateUpload(fileOf([0xff, 0xd8, 0xff, 0xe0, 0], "a.jpg", "image/jpeg"));
    expect(result.mediaType).toBe("image/jpeg");
  });

  it("detects a WebP", async () => {
    const riff = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0];
    const result = await validateUpload(fileOf(riff, "a.webp", "image/webp"));
    expect(result.mediaType).toBe("image/webp");
  });

  it("ignores the claimed name and type when the bytes don't match", async () => {
    const text = new TextEncoder().encode("hello");
    await expectCode(validateUpload(fileOf(text)), "INVALID_FILE");
  });
});
