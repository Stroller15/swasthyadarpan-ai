import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResultsView } from "@/components/results-view";
import type { ReportAnalysis } from "@/lib/schema";
import cbc from "@/tests/fixtures/cbc.json";

const analysis = cbc as ReportAnalysis;

describe("ResultsView", () => {
  it("shows the report heading, urgency and flagged rows", () => {
    render(<ResultsView analysis={analysis} onReset={() => {}} />);
    expect(screen.getByRole("heading", { name: "Complete Blood Count" })).toBeInTheDocument();
    expect(screen.getByText("See a doctor soon")).toBeInTheDocument();
    const row = screen.getAllByTestId("test-row").find((r) => within(r).queryByText("Hemoglobin"));
    expect(row).toBeDefined();
    expect(within(row!).getByText("Low")).toBeInTheDocument();
  });

  it("renders a dash for a missing unit and range", () => {
    const sparse = { ...analysis, tests: [{ name: "Urine colour", value: "Pale yellow", flag: "normal" as const, explanation: "Typical." }] };
    render(<ResultsView analysis={sparse} onReset={() => {}} />);
    const row = screen.getByTestId("test-row");
    expect(within(row).getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the summary and findings instead of a table when there are no lab values", () => {
    render(<ResultsView analysis={{ ...analysis, tests: [] }} onReset={() => {}} />);
    expect(screen.getByText("This report has no lab values to tabulate.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(analysis.summary)).toBeInTheDocument();
    expect(screen.getByText("Key findings")).toBeInTheDocument();
  });

  it("calls onReset from Analyze another report", async () => {
    const onReset = vi.fn();
    render(<ResultsView analysis={analysis} onReset={onReset} />);
    await userEvent.click(screen.getByRole("button", { name: "Analyze another report" }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
