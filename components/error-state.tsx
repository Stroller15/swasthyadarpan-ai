import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorCode } from "@/lib/errors";

// Retrying only helps when the failure was transient; the same file or an
// exhausted quota would fail again.
const RETRYABLE: ErrorCode[] = ["ANALYSIS_FAILED"];
const LIMIT_CODES: ErrorCode[] = ["RATE_LIMITED", "QUOTA_EXCEEDED"];

export function ErrorState({
  code,
  message,
  onRetry,
  onReset,
}: {
  code: ErrorCode;
  message: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Alert variant="destructive">
        <AlertCircle aria-hidden />
        <AlertTitle>We couldn&apos;t analyze that report</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="flex gap-2">
        {RETRYABLE.includes(code) && <Button onClick={onRetry}>Retry</Button>}
        <Button variant={RETRYABLE.includes(code) ? "outline" : "default"} onClick={onReset}>
          {LIMIT_CODES.includes(code) ? "Back to start" : "Choose another file"}
        </Button>
      </div>
    </div>
  );
}
