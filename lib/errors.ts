export type ErrorCode =
  | "BAD_REQUEST"
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "NOT_MEDICAL_REPORT"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "ANALYSIS_FAILED";

const ERRORS: Record<ErrorCode, { status: number; message: string }> = {
  BAD_REQUEST: { status: 400, message: "That request wasn't valid." },
  INVALID_FILE: {
    status: 400,
    message: "That file isn't a supported report. Upload a PDF, PNG, JPEG or WebP.",
  },
  FILE_TOO_LARGE: { status: 413, message: "That file is too large. The limit is 4 MB." },
  NOT_MEDICAL_REPORT: {
    status: 422,
    message: "This doesn't look like a medical report. Try a lab or diagnostic report.",
  },
  RATE_LIMITED: {
    status: 429,
    message: "You've reached the hourly limit for this demo. Please try again later.",
  },
  QUOTA_EXCEEDED: { status: 503, message: "The free demo has hit today's limit — try a sample later." },
  ANALYSIS_FAILED: { status: 500, message: "Something went wrong while reading your report. Please try again." },
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? ERRORS[code].message);
    this.name = "AppError";
    this.code = code;
    this.status = ERRORS[code].status;
  }
}

function hasStatusCode(err: unknown, status: number): boolean {
  return typeof err === "object" && err !== null && "statusCode" in err && err.statusCode === status;
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (hasStatusCode(err, 429)) return new AppError("QUOTA_EXCEEDED");
  return new AppError("ANALYSIS_FAILED");
}

export function errorResponse(err: unknown): Response {
  const appError = toAppError(err);
  return Response.json(
    { error: { code: appError.code, message: appError.message } },
    { status: appError.status },
  );
}
