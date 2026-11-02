import { defineConfig, devices } from "@playwright/test";

// A dedicated port, so a running `npm run dev` (with a real key) is never reused by mistake.
const PORT = 3210;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { AI_MOCK: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
