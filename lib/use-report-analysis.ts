"use client";

import { useCallback, useRef, useState } from "react";
import { AppError, type ErrorCode } from "@/lib/errors";
import type { ReportAnalysis } from "@/lib/schema";

export type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "result"; analysis: ReportAnalysis }
  | { status: "error"; code: ErrorCode; message: string };

type ApiResponse = { analysis?: ReportAnalysis; error?: { code: ErrorCode; message: string } };

const failed = (): AnalysisState => {
  const err = new AppError("ANALYSIS_FAILED");
  return { status: "error", code: err.code, message: err.message };
};

async function requestAnalysis(file: File): Promise<AnalysisState> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await fetch("/api/analyze", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as ApiResponse;
    if (res.ok && json.analysis) return { status: "result", analysis: json.analysis };
    if (json.error) return { status: "error", code: json.error.code, message: json.error.message };
    return failed();
  } catch {
    return failed();
  }
}

export function useReportAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const lastFile = useRef<File | null>(null);

  const analyzeFile = useCallback(async (file: File) => {
    lastFile.current = file;
    setState({ status: "analyzing" });
    setState(await requestAnalysis(file));
  }, []);

  const analyzeSample = useCallback(
    async (path: string) => {
      setState({ status: "analyzing" });
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Sample not found: ${path}`);
        const name = path.split("/").pop() ?? "sample.pdf";
        await analyzeFile(new File([await res.blob()], name, { type: "application/pdf" }));
      } catch {
        setState(failed());
      }
    },
    [analyzeFile],
  );

  const retry = useCallback(async () => {
    if (lastFile.current) await analyzeFile(lastFile.current);
    else setState({ status: "idle" });
  }, [analyzeFile]);

  const reset = useCallback(() => {
    lastFile.current = null;
    setState({ status: "idle" });
  }, []);

  return { state, analyzeFile, analyzeSample, retry, reset };
}
