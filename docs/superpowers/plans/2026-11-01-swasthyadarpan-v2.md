# SwasthyaDarpan v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild SwasthyaDarpan into a portfolio-grade medical report explainer. One Gemini call returns structured, flag-checked results, and the app adds follow-up chat, hardened uploads, tests and CI.

**Architecture:** This is a stateless Next.js 16 app. `POST /api/analyze` validates the upload and sends the file to Gemini through the Vercel AI SDK with schema-validated structured output, then re-checks flags in code. `POST /api/chat` streams answers grounded in the analysis JSON, which the browser holds and sends back. All model access goes through one module that can be swapped for a mock (`AI_MOCK=1`), so tests and CI need no key.

**Tech Stack:** Next.js 16.4, React 19.3, Tailwind 4, shadcn/ui, `ai` 7 + `@ai-sdk/google` 4 + `@ai-sdk/react` 4, zod 4, Vitest 5 + Testing Library, Playwright 1.64, pdf-lib (dev, samples only).

**Spec:** `docs/superpowers/specs/2026-11-01-swasthyadarpan-v2-design.md`

## Global Constraints

- Work on branch `revamp/v2`. Node 20+ (local is 26).
- Max upload: 4 MB (4 * 1024 * 1024 bytes). Allowed: PDF, PNG, JPEG, WebP, detected by magic bytes.
- Rate limits: 5 analyses and 30 chat messages per IP per rolling hour window (fixed window).
- Chat: max 20 messages per request.
- Analysis temperature: 0.2. Route `maxDuration = 60`, `runtime = "nodejs"`.
- Env: `GOOGLE_GENERATIVE_AI_API_KEY` (required unless mocked), `AI_MODEL` (optional), `AI_MOCK=1` (tests/CI).
- Never log report content or analysis JSON. Never write uploads to disk.
- Error codes, exactly: `INVALID_FILE`, `FILE_TOO_LARGE`, `NOT_MEDICAL_REPORT`, `RATE_LIMITED`, `QUOTA_EXCEEDED`, `ANALYSIS_FAILED`, plus `BAD_REQUEST` (an addition to the spec, used for malformed API request bodies).
- Disclaimer copy: "Educational tool, not medical advice."
- Quota copy: "The free demo has hit today's limit — try a sample later."
- Sample patients are fictitious.
- AI SDK API names (structured output helper, mock model class, UI stream helpers) follow the installed `ai@7` docs. Where this plan names one, confirm it in `node_modules/ai` before use.

## Review Focus

1. **Reference range only as text** (e.g. `"< 200"`, `"70 - 110"`, `"up to 40"`) with a numeric value. The user expects 240 against `< 200` to be flagged high. Covered in Task 3 (`parseRangeText`).
2. **Values printed with commas, comparators or flags** (`"1,250"`, `"<0.5"`, `"12.5 H"`). `"1,250"` must parse as 1250. A comparator value can't be decided, so the model's flag stands. Covered in Task 3.
3. **A real medical report with no lab values** (e.g. an X-ray narrative). The user expects the summary and findings, not an empty table. Covered in Task 11.
4. **A test row missing unit, range or category** (common on photos). It must render with "—" and not crash. Covered in Task 11.
5. **A chat request with a tampered analysis, no messages, or more than 20 messages** must return 400 `BAD_REQUEST` without ever reaching the model. Covered in Task 8.

---

### Task 1: Upgrade stack and clear out v1

**Files:**
- Modify: `package.json`, `next.config.js` → `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `components.json`
- Delete: `app/api/upload/route.ts`, `lib/groq-service.ts`, `components/MedicalReportAnalyzer.tsx`, `components/UploadCard.tsx`, `components/ResultsCard.tsx`, `components/AnalysisSteps.tsx`, `components/ui/*`, `hooks/use-toast.ts`, `tailwind.config.ts`, `.eslintrc.json` (replaced by flat config)
- Create: `.env.example`, `vitest.config.ts`, `tests/setup.ts`, `tests/unit/smoke.test.ts`, `eslint.config.mjs`; rewrite `postcss.config.mjs` to use only `@tailwindcss/postcss`

**Interfaces:**
- Produces: the scripts `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:e2e` (`playwright test`); the path alias `@/*` → repo root.

- [ ] **Step 1:** Remove deps: `llamaindex groq-sdk formidable endent dotenv shadcn-ui next-themes file-loader ignore-loader node-loader @types/react-dropzone @types/formidable`. Keep `react-dropzone lucide-react clsx tailwind-merge class-variance-authority`. Drop `react-markdown remark-gfm` (they're no longer used).
- [ ] **Step 2:** Install `next@16 react@19 react-dom@19 ai@7 @ai-sdk/google@4 @ai-sdk/react@4 zod@4`. Dev: `tailwindcss@4 @tailwindcss/postcss typescript @types/react@19 @types/react-dom@19 @types/node eslint eslint-config-next@16 vitest@5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test pdf-lib tsx`.
- [ ] **Step 3:** Delete the v1 files listed above. Write `next.config.ts` as an empty config with no webpack block. Re-run `npx shadcn@latest init` for Tailwind 4, then add only `button card badge alert table collapsible input scroll-area`.
- [ ] **Step 4:** `app/page.tsx` renders a placeholder `<main>SwasthyaDarpan</main>`. `app/layout.tsx` keeps the Geist fonts and sets title "SwasthyaDarpan — understand your medical report".
- [ ] **Step 5:** `vitest.config.ts`: react plugin, `environment: "jsdom"`, `setupFiles: ["tests/setup.ts"]` (imports `@testing-library/jest-dom/vitest`), alias `@` → root, `include: ["tests/unit/**/*.test.{ts,tsx}"]`. The smoke test asserts `1 + 1 === 2`.
- [ ] **Step 6:** `.env.example` holds the three env vars with comments. `.gitignore` adds `playwright-report/ test-results/`.
- [ ] **Step 7: Verify.** Run `npm run lint && npm run typecheck && npm test && npm run build`. Expected: all pass, and the build output lists route `/` only.
- [ ] **Step 8: Commit** with message `chore: upgrade to Next 16/React 19/Tailwind 4 and remove v1 pipeline`.

---

### Task 2: Data contract and fixtures

**Files:**
- Create: `lib/schema.ts`, `tests/fixtures/cbc.json`, `tests/fixtures/lipid.json`, `tests/fixtures/thyroid.json`, `tests/fixtures/not-medical.json`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Produces:
  - `FlagSchema` = `z.enum(["low","normal","high","critical","unknown"])` and `type Flag`.
  - `ReferenceRangeSchema` `{ low?: number; high?: number; text: string }`.
  - `TestResultSchema` and `type TestResult`.
  - `ReportAnalysisSchema` and `type ReportAnalysis`, with fields exactly as in the spec's "lib/schema.ts" block.
  - `UrgencySchema` = `z.enum(["routine","soon","urgent"])`.
  - Every field gets a `.describe()` that tells the model what to put there. These descriptions are the extraction instructions the model sees.

- [ ] **Step 1: Write the failing test.**
  - `it("accepts every fixture")`: every file in `tests/fixtures/*.json` passes `ReportAnalysisSchema.parse`.
  - `it("rejects an unknown flag")`: a CBC fixture with `tests[0].flag = "elevated"` fails `safeParse`.
  - `it("allows a test with only name, value, flag, explanation")`: passes.
- [ ] **Step 2: Write fixtures.**
  - `cbc.json`: fictitious patient "Aarav Mehta". Hemoglobin `"10.8"` g/dL, range `{low:13, high:17, text:"13 - 17"}`, flag `low`. Plus 5 normal rows and one text-only row (`"Platelet morphology"`, `"Normal"`, no range). Urgency `soon`.
  - `lipid.json`: "Priya Nair". LDL `"162"`, range `{high:100, text:"< 100"}`, flag `high`. Plus 3 others.
  - `thyroid.json`: "Rohan Das". TSH, T3 and T4 all normal; urgency `routine`.
  - `not-medical.json`: `isMedicalReport:false`, `rejectionReason:"This looks like a restaurant bill, not a medical report."`, `tests:[]`.
- [ ] **Step 3:** Run `npx vitest run tests/unit/schema.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 4:** Implement `lib/schema.ts`.
- [ ] **Step 5:** Run the same command. Expected: PASS.
- [ ] **Step 6: Commit** with message `feat: add ReportAnalysis schema and fixtures`.

---

### Task 3: Deterministic flag reconciliation

**Files:**
- Create: `lib/flags.ts`
- Test: `tests/unit/flags.test.ts`

**Interfaces:**
- Consumes: `TestResult`, `Flag` (Task 2).
- Produces:
  - `parseNumericValue(value: string): number | null`
  - `parseRangeText(text: string): { low?: number; high?: number }`
  - `reconcileFlag(test: TestResult): Flag`
  - `reconcileFlags(tests: TestResult[]): TestResult[]`, which returns copies with `flag` replaced.

- [ ] **Step 1: Write failing tests** with these cases:
  - **`parseNumericValue`:**
    - `"13.2"`→13.2
    - `"1,250"`→1250
    - `"12.5 H"`→12.5 (strips a trailing H/L flag letter)
    - `"<0.5"`→null
    - `">90"`→null
    - `"Negative"`→null
    - `""`→null
  - **`parseRangeText`:**
    - `"13 - 17"`→{low:13,high:17}
    - `"13–17"` (en dash)→same
    - `"< 200"`→{high:200}
    - `"≤5.6"`→{high:5.6}
    - `"> 40"`→{low:40}
    - `"up to 40"`→{high:40}
    - `"Negative"`→{}
  - **`reconcileFlag`:**
    - value 10.8, range {low:13,high:17}, model flag `normal` → `low`.
    - value 18 → `high`.
    - value 13 (boundary) → `normal`, and value 17 → `normal`.
    - value 240, range `{text:"< 200"}` with no numeric bounds → `high` (falls back to text parsing).
    - model flag `critical` with value 10.8 below low → `critical` (kept because the code agrees it's out of range).
    - model flag `critical` with value 15 in range → `normal`.
    - value `"<0.5"` with model flag `high` → `high` (undecidable, so the model's flag stands).
    - text value `"Normal"` with no range, model flag `normal` → `normal`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/flags.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Numeric bounds on `referenceRange` win over `parseRangeText(referenceRange.text)`. When the code can't decide (no numeric value, or no bounds at all), return the model's flag.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: reconcile model flags against reference ranges in code`.

---

### Task 4: Errors and upload validation

**Files:**
- Create: `lib/errors.ts`, `lib/upload.ts`
- Test: `tests/unit/errors.test.ts`, `tests/unit/upload.test.ts`

**Interfaces:**
- Produces:
  - `type ErrorCode` (the seven codes in Global Constraints) and `class AppError extends Error { code: ErrorCode; status: number }`.
  - Statuses: `BAD_REQUEST` 400 ("That request wasn't valid."), `INVALID_FILE` 400 ("That file isn't a supported report. Upload a PDF, PNG, JPEG or WebP."), `FILE_TOO_LARGE` 413, `NOT_MEDICAL_REPORT` 422, `RATE_LIMITED` 429, `QUOTA_EXCEEDED` 503, `ANALYSIS_FAILED` 500.
  - Default user-facing messages per code. `QUOTA_EXCEEDED` uses the quota copy from Global Constraints.
  - `toAppError(err: unknown): AppError`
  - `errorResponse(err: unknown): Response`, which returns JSON `{ error: { code, message } }` with the status.
  - `MAX_UPLOAD_BYTES = 4 * 1024 * 1024`
  - `type UploadMediaType = "application/pdf" | "image/png" | "image/jpeg" | "image/webp"`
  - `validateUpload(file: File | null): Promise<{ data: Uint8Array; mediaType: UploadMediaType }>`, which throws `AppError`.

- [ ] **Step 1: Write failing tests.**
  - **`toAppError`:**
    - an `AppError` is returned unchanged.
    - an error object with `statusCode: 429` (the shape of AI SDK `APICallError`) → `QUOTA_EXCEEDED`.
    - a plain `Error` → `ANALYSIS_FAILED`, and the message does not leak the original text.
  - **`errorResponse`:** status and body shape.
  - **`validateUpload`:**
    - `null` → `INVALID_FILE`.
    - empty file → `INVALID_FILE`.
    - 4 MB + 1 byte → `FILE_TOO_LARGE`.
    - bytes `%PDF-` → `application/pdf`.
    - PNG signature `89 50 4E 47 0D 0A 1A 0A` → `image/png`.
    - `FF D8 FF` → `image/jpeg`.
    - `RIFF....WEBP` → `image/webp`.
    - a file named `report.pdf` with type `application/pdf` but contents `hello` → `INVALID_FILE`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/errors.test.ts tests/unit/upload.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement both modules.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add typed app errors and magic-byte upload validation`.

---

### Task 5: Rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Test: `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Consumes: `AppError` (Task 4).
- Produces:
  - `createRateLimiter({ limit: number; windowMs: number; now?: () => number })`, which returns `{ check(key: string): void }`. `check` throws `AppError("RATE_LIMITED")` when the key exceeds the limit.
  - `analyzeLimiter` (5 per hour) and `chatLimiter` (30 per hour) singletons.
  - `clientKey(req: Request): string`, which uses the first IP in `x-forwarded-for`, else `x-real-ip`, else `"anonymous"`.

- [ ] **Step 1: Write failing tests** using an injected `now`:
  - 5 checks pass and the 6th throws `RATE_LIMITED`.
  - After `windowMs`, the key resets.
  - Different keys are independent.
  - `clientKey` parses `"1.2.3.4, 5.6.7.8"` → `"1.2.3.4"`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/rate-limit.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement a fixed window using `Map<string, { count, resetAt }>`. Prune expired entries whenever the map passes 1,000 keys.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add in-memory per-IP rate limiter`.

---

### Task 6: AI layer (model, prompts, analyze)

**Files:**
- Create: `lib/ai/model.ts`, `lib/ai/mock-model.ts`, `lib/ai/prompts.ts`, `lib/ai/analyze.ts`
- Test: `tests/unit/analyze.test.ts`

**Interfaces:**
- Consumes: `ReportAnalysisSchema` and `ReportAnalysis` (Task 2), `reconcileFlags` (Task 3), `AppError` (Task 4), the fixtures.
- Produces:
  - `getModel(): LanguageModel`. With `AI_MOCK=1` it returns `createMockModel()`. Otherwise it returns `google(process.env.AI_MODEL ?? DEFAULT_MODEL)`.
  - `DEFAULT_MODEL` is the current free-tier Gemini Flash id. Confirm it in Google AI Studio and record the date checked in a comment.
  - `createMockModel()` uses the AI SDK's mock language model from `ai/test`. Structured-output calls return `tests/fixtures/cbc.json`. Streaming calls stream the text `"Your hemoglobin is a little below the usual range. Please discuss it with your doctor."`.
  - `SAFETY_RULES: string`, `ANALYSIS_PROMPT: string`, `buildChatSystemPrompt(analysis: ReportAnalysis): string`. Rule content is copied from the spec's "lib/ai/prompts.ts" section.
  - `analyzeReport(input: { data: Uint8Array; mediaType: UploadMediaType }, model?: LanguageModel): Promise<ReportAnalysis>`

- [ ] **Step 1: Write failing tests**, injecting a mock model that returns a given fixture:
  - `it("returns the analysis with flags reconciled")`: use the CBC fixture with hemoglobin's flag edited to `normal`. The result has hemoglobin `low`.
  - `it("throws NOT_MEDICAL_REPORT with the model's reason")`: use the `not-medical` fixture. The error code is `NOT_MEDICAL_REPORT` and the message equals `rejectionReason`.
  - `it("sends the file as a file part with temperature 0.2")`: inspect the mock's recorded call. The prompt contains a file part with the given `mediaType`, and `temperature === 0.2`.
  - `it("chat system prompt embeds the analysis and safety rules")`: `buildChatSystemPrompt(cbc)` contains `"Hemoglobin"` and `SAFETY_RULES`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/analyze.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `analyzeReport`. Call `generateText` with `output: Output.object({ schema: ReportAnalysisSchema })`, or `generateObject` if that is what the installed `ai@7` documents. Send the system prompt `ANALYSIS_PROMPT + SAFETY_RULES` and one user message containing a text part and a `{ type: "file", data, mediaType }` part. Set no `maxOutputTokens` cap. Then apply `reconcileFlags`.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add Gemini structured analysis with mockable model`.

---

### Task 7: `POST /api/analyze`

**Files:**
- Create: `app/api/analyze/route.ts`
- Test: `tests/unit/analyze-route.test.ts`

**Interfaces:**
- Consumes: `analyzeLimiter`, `clientKey`, `validateUpload`, `analyzeReport`, `errorResponse`.
- Produces: `POST(req: Request): Promise<Response>`. It takes multipart field `file`. Success is 200 `{ analysis: ReportAnalysis }`. Errors use the `errorResponse` shape. Exports `maxDuration = 60` and `runtime = "nodejs"`.

- [ ] **Step 1: Write failing tests.** Set `AI_MOCK=1` and use `vi.resetModules()` between limiter tests.
  - A valid PDF upload returns 200 with `analysis.reportType` from the CBC fixture.
  - A missing `file` field returns 400 `INVALID_FILE`.
  - A text file returns 400 `INVALID_FILE`.
  - The 6th request from the same `x-forwarded-for` returns 429 `RATE_LIMITED`.
  - When `analyzeReport` is mocked (`vi.mock`) to throw `{ statusCode: 429 }`, the route returns 503 `QUOTA_EXCEEDED`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/analyze-route.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement as wiring only: limiter → `formData()` → validate → analyze → JSON, all wrapped in `try`/`errorResponse`. Do not log the request body.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add /api/analyze route`.

---

### Task 8: `POST /api/chat`

**Files:**
- Create: `app/api/chat/route.ts`
- Test: `tests/unit/chat-route.test.ts`

**Interfaces:**
- Consumes: `chatLimiter`, `clientKey`, `ReportAnalysisSchema`, `buildChatSystemPrompt`, `getModel`, `errorResponse`, `AppError`.
- Produces:
  - `POST(req: Request): Promise<Response>`. The body is `{ messages: UIMessage[]; analysis: ReportAnalysis }`.
  - It returns `streamText(...).toUIMessageStreamResponse()`, using the helper name from the installed `ai@7`.
  - A malformed body returns 400 `BAD_REQUEST` (Task 4).

- [ ] **Step 1: Write failing tests** (`AI_MOCK=1`):
  - A valid body with one user message returns 200, and the streamed body contains `"hemoglobin"` (case-insensitive).
  - An invalid `analysis` (`tests` missing) returns 400 `BAD_REQUEST`.
  - `messages: []` returns 400 `BAD_REQUEST`.
  - 21 messages returns 400 `BAD_REQUEST`.
  - The 31st request from the same IP returns 429.
- [ ] **Step 2:** Run `npx vitest run tests/unit/chat-route.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Validate with zod (`messages` is an array of 1–20 items, and `analysis` uses `ReportAnalysisSchema`). Then call `streamText({ model: getModel(), system: buildChatSystemPrompt(analysis), messages: convertToModelMessages(messages) })`.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5: Commit** with message `feat: add grounded /api/chat streaming route`.

---

### Task 9: Sample report PDFs

**Files:**
- Create: `scripts/make-samples.ts`, `public/samples/cbc.pdf`, `public/samples/lipid.pdf`, `public/samples/thyroid.pdf`, `lib/samples.ts`
- Test: `tests/unit/samples.test.ts`

**Interfaces:**
- Consumes: the fixtures (Task 2), which are the single source of patient, test and value data.
- Produces: `SAMPLES: { id: "cbc" | "lipid" | "thyroid"; label: string; description: string; path: string }[]`, with labels "Blood count (CBC)", "Cholesterol panel" and "Thyroid panel".

- [ ] **Step 1: Write a failing test.** Every `SAMPLES[i].path` exists under `public/` and starts with `%PDF-`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/samples.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Write `scripts/make-samples.ts` using pdf-lib. It reads each fixture and draws a lab letterhead ("Sample Diagnostics Lab — SAMPLE REPORT, fictitious patient"), patient details, and a table of Test / Result / Unit / Reference range. Add `"samples": "tsx scripts/make-samples.ts"` to `package.json`, run it, then write `lib/samples.ts`.
- [ ] **Step 4:** Run again. Expected: PASS. Open one PDF to eyeball it.
- [ ] **Step 5: Commit** with message `feat: add generated synthetic sample reports`.

---

### Task 10: Page shell: state, upload, samples, progress, errors, disclaimer

**Files:**
- Create: `components/report-explainer.tsx` (client, owns the reducer), `lib/use-report-analysis.ts`, `components/upload-panel.tsx`, `components/sample-reports.tsx`, `components/analysis-progress.tsx`, `components/error-state.tsx`, `components/disclaimer.tsx`
- Modify: `app/page.tsx`
- Test: `tests/unit/use-report-analysis.test.ts`, `tests/unit/upload-panel.test.tsx`

**Interfaces:**
- Consumes: `ReportAnalysis`, `ErrorCode`, `SAMPLES`, `MAX_UPLOAD_BYTES`.
- Produces:
  - `type AnalysisState = { status: "idle" } | { status: "analyzing" } | { status: "result"; analysis: ReportAnalysis } | { status: "error"; code: ErrorCode; message: string }`
  - `useReportAnalysis()` returns `{ state, analyzeFile(file: File): Promise<void>, analyzeSample(path: string): Promise<void>, reset(): void }`. A network failure maps to `ANALYSIS_FAILED`.
  - `ReportExplainer` renders the matching view per state. In `result` it renders `<ResultsPlaceholder>` until Task 11 replaces it.

- [ ] **Step 1: Write failing tests.**
  - **Hook (mock `fetch`):** `analyzeFile` moves idle → analyzing → result. A 503 response with `QUOTA_EXCEEDED` moves to an error state with that code and message. A rejected fetch gives `ANALYSIS_FAILED`. `reset` returns to idle.
  - **`UploadPanel`:** dropping a 5 MB file shows `"File is too large (max 4 MB)"` without calling `onFile`. Dropping a PDF calls `onFile` once.
- [ ] **Step 2:** Run `npx vitest run tests/unit/use-report-analysis.test.ts tests/unit/upload-panel.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement the components.
  - `UploadPanel` uses `react-dropzone` with the same accepted types and a client-side size check (the server check stays authoritative).
  - `AnalysisProgress` steps through "Reading report → Extracting values → Explaining results" on a 2.5 s timer and holds on the last step.
  - `ErrorState` shows the message and Retry, plus "Try a sample" when the code is `RATE_LIMITED` or `QUOTA_EXCEEDED`.
  - `Disclaimer` is a fixed footer with the disclaimer copy.
  - The idle view includes the privacy note from the spec.
- [ ] **Step 4:** Run again, then `npm run build`. Expected: PASS.
- [ ] **Step 5:** Run `AI_MOCK=1 npm run dev`, click the CBC sample, and confirm the analyzing view leads to the result placeholder.
- [ ] **Step 6: Commit** with message `feat: add page shell with upload, samples, progress and errors`.

---

### Task 11: Results view

**Files:**
- Create: `components/results-view.tsx`, `components/summary-card.tsx`, `components/test-results-table.tsx`, `components/findings-list.tsx`, `lib/group-tests.ts`
- Modify: `components/report-explainer.tsx` (replace the placeholder)
- Test: `tests/unit/group-tests.test.ts`, `tests/unit/results-view.test.tsx`

**Interfaces:**
- Consumes: `ReportAnalysis`, `TestResult`, `Flag`.
- Produces:
  - `groupTests(tests: TestResult[]): { category: string; tests: TestResult[] }[]`. Missing categories become `"Other"`. Groups that contain any abnormal test (`low`/`high`/`critical`) sort first, and within a group abnormal rows sort first, with the original order kept otherwise.
  - `ResultsView({ analysis, onReset, chatSlot?: ReactNode })`.

- [ ] **Step 1: Write failing tests.**
  - **`groupTests`:** for the CBC fixture, the hemoglobin row comes first. A missing category goes to `"Other"`. The sort is stable for normal rows.
  - **`ResultsView`:**
    - With CBC it shows the "Complete Blood Count" heading, the urgency badge text "See a doctor soon", and the hemoglobin row with a "Low" badge.
    - With a test that has no unit, range or category, it renders "—" in those cells.
    - With `tests: []` it renders the summary and findings, plus the text "This report has no lab values to tabulate.", and no `<table>`.
    - "Analyze another report" calls `onReset`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/group-tests.test.ts tests/unit/results-view.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement the view.
  - Urgency badge text: routine → "Routine", soon → "See a doctor soon", urgent → "Seek care promptly".
  - Flag badge colors: red for critical/high, amber for low, green for normal, grey for unknown.
  - Each row has an expandable explanation (`collapsible`). Below the `md` breakpoint, rows render as cards.
  - `FindingsList` renders three titled lists: "Key findings", "Questions for your doctor" and "General tips".
- [ ] **Step 4:** Run again. Expected: PASS. Check it visually on desktop and mobile with `AI_MOCK=1 npm run dev`.
- [ ] **Step 5: Commit** with message `feat: add structured results view`.

---

### Task 12: Report chat

**Files:**
- Create: `components/report-chat.tsx`
- Modify: `components/report-explainer.tsx` (pass `<ReportChat analysis>` as `chatSlot`)
- Test: `tests/unit/report-chat.test.tsx`

**Interfaces:**
- Consumes: `ReportAnalysis`, `/api/chat` (Task 8).
- Produces: `ReportChat({ analysis })`. It uses `useChat` from `@ai-sdk/react` with a transport that posts to `/api/chat` and adds `analysis` to the body. It shows three starter buttons:
  - "What should I ask my doctor first?"
  - "Explain my abnormal results simply"
  - "Is anything here urgent?"

- [ ] **Step 1: Write failing tests** (mock `fetch` with a UI message stream, or mock `useChat`):
  - It renders the three starters.
  - Clicking a starter sends that text as the user message, and the request body includes `analysis`.
  - Input is disabled while streaming.
  - Once the conversation has 20 messages, the input is replaced with "Chat limit reached — start a new report to keep asking."
- [ ] **Step 2:** Run `npx vitest run tests/unit/report-chat.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement. Show a stream error as an inline message with the server's error text.
- [ ] **Step 4:** Run again, then check manually with `AI_MOCK=1 npm run dev`: sample → ask a starter → the mock reply streams in.
- [ ] **Step 5: Commit** with message `feat: add chat grounded in the analysis`.

---

### Task 13: End-to-end tests and CI

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/flow.spec.ts`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the whole app with `AI_MOCK=1`.

- [ ] **Step 1: Write the e2e specs.**
  - `"sample report → results → chat"`: go to `/`, click "Blood count (CBC)", and expect the "Low" badge on the Hemoglobin row within 15 s. Click "Is anything here urgent?" and expect text containing "hemoglobin". Expect the disclaimer to be visible.
  - `"invalid file shows error"`: set the file input to a `.txt` buffer renamed `.pdf`, and expect the "That file isn't a supported report" message (the `INVALID_FILE` default copy from Task 4) and a Retry button.
- [ ] **Step 2:** `playwright.config.ts` sets `webServer` to `npm run build && npm run start` with env `AI_MOCK=1`, port 3000, Chromium only.
- [ ] **Step 3:** Run `npx playwright install chromium && npm run test:e2e`. Expected: 2 passed.
- [ ] **Step 4:** `ci.yml` runs on push and pull_request. The steps are: Node 22, `npm ci`, lint, typecheck, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:e2e` with `AI_MOCK=1`. No secrets.
- [ ] **Step 5: Commit** with message `test: add Playwright e2e and GitHub Actions CI`. After pushing, confirm the workflow passes on GitHub.

---

### Task 14: README and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Rewrite the README. Follow the outline in the spec's "Docs" section:
  - Correct the clone URL to `https://github.com/Stroller15/swasthyadarpan-ai.git`.
  - Add a Mermaid diagram of the architecture.
  - Describe local setup with a free key from Google AI Studio and `.env.example`.
  - List the test commands.
  - Add a disclaimer section.
  - Add screenshots taken from `AI_MOCK=1 npm run dev`, saved to `docs/images/`.
- [ ] **Step 2: Verify everything.** Run `npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build`. Expected: all pass.
- [ ] **Step 3: Live smoke test** with a real key in `.env.local`. Run all three samples and one non-medical image (expect `NOT_MEDICAL_REPORT`), and ask one chat question. Write down anything the real model does that the fixtures didn't cover.
- [ ] **Step 4: Commit** with message `docs: rewrite README for v2`.
