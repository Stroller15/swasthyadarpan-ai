import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadPanel } from "@/components/upload-panel";

const pdf = (name = "blood-test.pdf") =>
  new File([new Uint8Array(2048)], name, { type: "application/pdf" });

const chooseFiles = (files: File[]) => {
  fireEvent.change(screen.getByTestId("upload-input"), { target: { files } });
};

describe("UploadPanel", () => {
  it("rejects files over 4 MB without selecting them", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    chooseFiles([new File([new Uint8Array(5 * 1024 * 1024)], "big.pdf", { type: "application/pdf" })]);
    expect(await screen.findByText("File is too large (max 4 MB)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analyze report" })).not.toBeInTheDocument();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("shows the chosen file without analyzing it yet", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    chooseFiles([pdf()]);
    expect(await screen.findByText("blood-test.pdf")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("analyzes the chosen file only when Analyze report is clicked", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    const file = pdf();
    chooseFiles([file]);
    await userEvent.click(await screen.findByRole("button", { name: "Analyze report" }));
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file);
  });

  it("lets you remove the chosen file and pick again", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    chooseFiles([pdf()]);
    await userEvent.click(await screen.findByRole("button", { name: "Remove blood-test.pdf" }));
    expect(screen.queryByText("blood-test.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("Drop your report here, or click to choose")).toBeInTheDocument();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("replaces the selection when another file is chosen", async () => {
    const onFile = vi.fn();
    render(<UploadPanel onFile={onFile} />);
    chooseFiles([pdf("first.pdf")]);
    await screen.findByText("first.pdf");
    const second = pdf("second.pdf");
    chooseFiles([second]);
    expect(await screen.findByText("second.pdf")).toBeInTheDocument();
    expect(screen.queryByText("first.pdf")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Analyze report" }));
    expect(onFile).toHaveBeenCalledExactlyOnceWith(second);
  });
});
