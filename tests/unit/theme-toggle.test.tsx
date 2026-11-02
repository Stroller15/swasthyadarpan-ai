import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

function stubSystemTheme(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
}

const renderToggle = () =>
  render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeToggle />
    </ThemeProvider>,
  );

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    stubSystemTheme(false);
  });

  it("starts by following the system theme", async () => {
    renderToggle();
    expect(await screen.findByRole("button", { name: "Theme: system. Switch to light" })).toBeInTheDocument();
  });

  it("cycles system → light → dark → system", async () => {
    renderToggle();
    await userEvent.click(await screen.findByRole("button", { name: /Switch to light/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Theme: light. Switch to dark" }));
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    await userEvent.click(screen.getByRole("button", { name: "Theme: dark. Switch to system" }));
    await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
  });

  it("applies dark when the system prefers dark", async () => {
    stubSystemTheme(true);
    renderToggle();
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });
});
