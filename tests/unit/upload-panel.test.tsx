import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UploadPanel } from "@/components/upload-panel";

const dropFiles = (files: File[]) => {
  const input = screen.getByTestId("upload-input");
  fireEvent.change(input, { target: { files } });
};

describe("UploadPanel", () => {
  it("rejects files over 4 MB without calling onFile", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "big.pdf", { type: "application/pdf" });
    dropFiles([big]);
    expect(await screen.findByText("File is too large (max 4 MB)")).toBeInTheDocument();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("passes a PDF to onFile", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "r.pdf", { type: "application/pdf" });
    dropFiles([file]);
    await waitFor(() => expect(onFile).toHaveBeenCalledTimes(1));
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
