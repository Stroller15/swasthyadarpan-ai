import { expect, test } from "@playwright/test";

test("sample report → results → chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Educational tool, not medical advice.")).toBeVisible();

  await page.getByRole("button", { name: /Blood count \(CBC\)/ }).click();
  const hemoglobin = page.getByTestId("test-row").filter({ hasText: "Hemoglobin" });
  await expect(hemoglobin.getByText("Low", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Is anything here urgent?" }).click();
  await expect(page.getByText(/hemoglobin is a little below/i)).toBeVisible();

  // A follow-up resends the history, including the assistant reply's real stream parts.
  await page.getByRole("textbox", { name: "Ask a question about your results" }).fill("Why does that matter?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/hemoglobin is a little below/i)).toHaveCount(2);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0); // outside main: Next.js route announcer
});

test("choosing a file waits for Analyze report; an invalid file shows an error", async ({ page }) => {
  const analyzeCalls: string[] = [];
  page.on("request", (req) => req.url().endsWith("/api/analyze") && analyzeCalls.push(req.url()));

  await page.goto("/");
  await page.getByTestId("upload-input").setInputFiles({
    name: "not-a-report.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("hello, this is plain text"),
  });
  await expect(page.getByText("not-a-report.pdf")).toBeVisible();
  expect(analyzeCalls).toHaveLength(0);

  await page.getByRole("button", { name: "Analyze report" }).click();
  await expect(page.getByText("That file isn't a supported report")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose another file" })).toBeVisible();
});
