# SwasthyaDarpan v2 — Design

Date: 2026-11-01
Branch: `revamp/v2`

## Intent

**What the owner asked for:** revamp this old project into a portfolio showcase. Rebuild the core, keep the idea (upload a medical report → get a plain-language explanation), stay on Next.js, and run on free services only for now.

**Assumptions (not stated by the owner):**
- It is deployed as a public live demo (Vercel free tier).
- There are no user accounts and nothing is persisted. A report lives only in the browser tab that uploaded it.

**Success criteria:**
- A visitor can try it in one click with a sample report, without uploading anything real.
- Results show every test as structured data, with abnormal values flagged clearly.
- Failures (bad file, non-medical document, free-quota exhausted) show a specific, friendly message, never a crash or a blank screen.
- The code is small, typed end to end, tested, and passes CI without an API key.
- The README explains the architecture well enough that a reviewer understands it in two minutes.

## What changes from v1

| v1 | v2 |
|---|---|
| LlamaParse extracts text, then Groq Llama writes free-form markdown | One Gemini call reads the PDF or image directly and returns schema-validated JSON |
| A keyword check ("test", "report") decides if a file is medical | The model decides (`isMedicalReport`), and the app enforces it |
| Analysis is cut off at 1024 tokens | Structured output with no artificial cap on sections |
| Upload goes to `/tmp` under the user's filename | Files are processed in memory and never written to disk |
| No file type/size checks | Server-side allowlist, size limit, and magic-byte check |
| `console.log` prints full reports | No report content is ever logged |
| Main component fakes analysis with a timer; results card is commented out | A real end-to-end flow with explicit UI states |
| No chat | Follow-up chat grounded in the analysis |
| No disclaimer or safety rules | Persistent disclaimer and safety rules in every prompt |
| Next 15.0.3, React 18, Tailwind 3, webpack hacks for onnxruntime | Next 16, React 19, Tailwind 4, no custom webpack config |
| No tests, no CI | Vitest unit tests, Playwright e2e on a mocked model, GitHub Actions |

## Architecture

```
Browser (single page, client state)
  │  multipart: file
  ▼
POST /api/analyze ──► rate limit ──► validate upload ──► analyzeReport()
  │                                                        │ AI SDK structured output
  │                                                        ▼
  │                                                  Gemini (free tier)
  │◄── ReportAnalysis JSON  (flags re-checked in code)
  │
  │  { messages, analysis }
  ▼
POST /api/chat ──► rate limit ──► streamText() grounded in the analysis ──► streamed reply
```

The server is stateless. The browser keeps the analysis and sends it back with each chat request. This keeps the server free of storage and sessions. Chat sends the extracted JSON, not the original file, which saves tokens and free-tier quota.

### Model provider

- All model access goes through the Vercel AI SDK (`ai` v7) with `@ai-sdk/google`.
- The model id lives in one place (`lib/ai/model.ts`), read from `AI_MODEL` with a default of a current free-tier Gemini Flash model. The exact default is confirmed against Google AI Studio during implementation, because the free model list keeps changing.
- Switching to a paid provider later means changing that file and adding a package, nothing else.
- `AI_MOCK=1` swaps in a mock model that returns fixture data, for e2e tests and CI.

## Units

Each unit has one job and can be tested on its own.

### `lib/schema.ts` — the data contract
Zod schemas, with TypeScript types inferred from them. These are shared by the model call, the API responses and the UI.

```ts
ReportAnalysis {
  isMedicalReport: boolean
  rejectionReason?: string          // set when isMedicalReport is false
  reportType: string                // e.g. "Complete Blood Count"
  reportDate?: string
  patient?: { name?: string; age?: string; sex?: string }
  summary: string                   // 2–4 plain-language sentences
  tests: TestResult[]
  keyFindings: string[]             // most important points, abnormal first
  questionsForDoctor: string[]
  generalTips: string[]             // general wellness only, never treatment
  urgency: "routine" | "soon" | "urgent"
}

TestResult {
  name: string
  value: string                     // as printed, e.g. "13.2" or "Negative"
  unit?: string
  referenceRange?: { low?: number; high?: number; text: string }
  flag: "low" | "normal" | "high" | "critical" | "unknown"
  explanation: string               // one plain-language sentence
  category?: string                 // e.g. "Red blood cells", used for grouping
}
```

### `lib/flags.ts` — deterministic flag check
- `reconcileFlag(test): Flag`. When the value parses as a number and the range has numeric bounds, the flag is computed in code: below `low` → `low`, above `high` → `high`, otherwise `normal`.
- A computed flag overrides the model's flag. `critical` from the model is kept only when the code agrees the value is out of range.
- When the code can't decide (text value, no range), the model's flag stands.
- This is the main guard against the model mis-flagging a value, and it is fully unit-tested.

### `lib/upload.ts` — upload validation
- Allowed types: PDF, PNG, JPEG, WebP. The check uses magic bytes, not the filename or the client-sent MIME type.
- Max size is 4 MB, because Vercel serverless functions reject request bodies over 4.5 MB.
- Returns `{ ok: true, data, mediaType } | { ok: false, error: AppError }`.

### `lib/rate-limit.ts` — protect the free quota
- In-memory fixed-window limiter keyed by client IP. Defaults: 5 analyses and 30 chat messages per IP per hour.
- Known limit: memory is per server instance, so this is best-effort on serverless. That's acceptable for a demo, and the interface allows a Redis-backed limiter later.

### `lib/errors.ts` — one error shape
- `AppError { code, message }`. Codes: `INVALID_FILE`, `FILE_TOO_LARGE`, `NOT_MEDICAL_REPORT`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `ANALYSIS_FAILED`.
- `toAppError(unknown)` maps provider errors: a 429 from Gemini becomes `QUOTA_EXCEEDED` ("The free demo has hit today's limit — try a sample later"), and anything else becomes `ANALYSIS_FAILED`.
- Every API error response is `{ error: AppError }` with a matching HTTP status.

### `lib/ai/prompts.ts` — prompts and safety rules
- Analysis prompt: extract every test exactly as printed, explain each in plain language, and set `isMedicalReport: false` for anything that isn't a medical lab or diagnostic report.
- Shared safety rules (included in both prompts): no diagnosis, no medication or dosage advice, recommend a doctor for anything abnormal, set urgency to `urgent` for critical values, and never invent values that aren't in the document.
- Chat prompt: answer only from the provided analysis. Say so when the report doesn't contain the answer, and steer diagnosis or treatment questions back to a doctor.

### `lib/ai/analyze.ts` — `analyzeReport({ data, mediaType })`
- Sends the file as a file part to the model, with structured output against `ReportAnalysis`. Temperature is low (0.2) for consistent extraction.
- Runs `reconcileFlag` on every test before returning.
- If `isMedicalReport` is false, throws `NOT_MEDICAL_REPORT` with the model's reason.

### `app/api/analyze/route.ts`
Rate limit → `validateUpload` → `analyzeReport` → JSON. `maxDuration = 60`, Node runtime. It contains no business logic beyond wiring.

### `app/api/chat/route.ts`
- Request body: `{ messages, analysis }`. The analysis is validated with the schema, so an arbitrary payload is never injected into the prompt.
- Calls `streamText` with the chat prompt plus the analysis, and returns a UI message stream for `@ai-sdk/react`'s `useChat`.
- Conversation length is capped at 20 messages.

## UI

One page, driven by a reducer with explicit states: `idle → analyzing → result | error`.

- **Idle:** hero with a one-line explanation, a drag-and-drop upload panel, three **sample report** buttons, and a privacy note: nothing is stored, and files are processed by Google Gemini, whose free tier may use inputs to improve its products.
- **Analyzing:** step indicator ("Reading report → Extracting values → Explaining results"). Steps advance on a timer while one request runs. The indicator is honest about this; it doesn't claim to track progress.
- **Result:**
  - Summary card: report type, date, urgency badge, and the summary.
  - **Results table:** grouped by category, abnormal rows first and highlighted. Each row has value, unit, range, a flag badge, and an expandable explanation. On mobile the table collapses to cards.
  - Key findings, questions for your doctor, and general tips.
  - Chat panel with three suggested starter questions.
  - "Analyze another report" resets to idle.
- **Error:** the `AppError` message with a retry button, plus "try a sample" when the error is quota or rate related.
- **Disclaimer:** a persistent footer banner on every state: "Educational tool, not medical advice."

Components (each in its own file under `components/`): `UploadPanel`, `SampleReports`, `AnalysisProgress`, `SummaryCard`, `TestResultsTable`, `FindingsList`, `ReportChat`, `Disclaimer`, `ErrorState`. shadcn/ui is re-initialized for Tailwind 4, and only the primitives used are added.

### Sample reports
- Three synthetic reports with fictitious patients: CBC with low hemoglobin, lipid panel with high LDL, and a thyroid panel with all values normal.
- Stored as PDFs in `public/samples/`.
- Clicking a sample fetches the PDF and runs it through the same `/api/analyze` path as an upload, so the demo always exercises the real pipeline.
- The matching mock fixtures live in `tests/fixtures/`.

## Dependencies

- **Add:** `ai`, `@ai-sdk/google`, `@ai-sdk/react`, `zod`, `vitest`, `@playwright/test`, `@testing-library/react`.
- **Upgrade:** `next` 16, `react`/`react-dom` 19, `tailwindcss` 4, and the shadcn/Radix pieces in use.
- **Remove:** `llamaindex`, `groq-sdk`, `formidable`, `endent`, `dotenv`, `shadcn-ui` (it's a CLI, not a runtime dependency), `next-themes`, `file-loader`, `ignore-loader`, `node-loader`, `@types/react-dropzone`, `@types/formidable`, and the custom webpack config in `next.config.js`.
- **Environment:** `GOOGLE_GENERATIVE_AI_API_KEY` (required), `AI_MODEL` (optional), `AI_MOCK` (tests only). Ship an `.env.example`.

## Testing

**Unit (Vitest):**
- `reconcileFlag`: boundaries, text values, missing ranges, and the critical-flag override.
- `validateUpload`: each allowed type, a spoofed extension, oversize, and empty files.
- Rate limiter: window rollover.
- `toAppError` mapping.
- Schema accepts the fixtures.
- `analyzeReport` with the AI SDK's mock model: a non-medical rejection, and flag reconciliation applied.

**Route tests:** both route handlers called directly with a mocked model, covering success and each error code.

**E2E (Playwright, `AI_MOCK=1`):**
- Sample report → results table shows a flagged row → ask a chat question → a reply streams in.
- Upload an invalid file → the error state appears.

**CI (GitHub Actions on push and PR):** lint, typecheck, unit tests, build, e2e. No API key is needed anywhere in CI.

## Docs

The README is rewritten:
- What it does, a live demo link, and screenshots.
- A Mermaid architecture diagram.
- The "why these choices" section: structured output, deterministic flag check, stateless server.
- Local setup with a free Gemini key.
- Testing commands.
- The disclaimer.

The wrong clone URL is fixed.

## Out of scope (possible phase 2)

- Accounts, saved history, and trend charts.
- Multi-language output.
- Paid models and Redis-backed rate limiting.
- A custom domain and analytics.
