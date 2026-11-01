import { expect, test } from "@playwright/test";

test("sample report → results → chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Educational tool, not medical advice.")).toBeVisible();

  await page.getByRole("button", { name: /Blood count \(CBC\)/ }).click();
  const hemoglobin = page.getByTestId("test-row").filter({ hasText: "Hemoglobin" });
  await expect(hemoglobin.getByText("Low", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Is anything here urgent?" }).click();
  await expect(page.getByText(/hemoglobin is a little below/i)).toBeVisible();
});

test("invalid file shows an error", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("upload-input").setInputFiles({
    name: "not-a-report.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("hello, this is plain text"),
  });
  await expect(page.getByText("That file isn't a supported report")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose another file" })).toBeVisible();
});
