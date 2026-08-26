import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeToggle } from "../theme-toggle";
import * as nextThemes from "next-themes";

vi.mock("next-themes");

describe("ThemeToggle Component", () => {
  it("renders theme toggle button with accessibility label", () => {
    const setThemeMock = vi.fn();
    vi.spyOn(nextThemes, "useTheme").mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: setThemeMock,
      themes: ["light", "dark"],
    } as any);

    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when current theme is light and clicked", () => {
    const setThemeMock = vi.fn();
    vi.spyOn(nextThemes, "useTheme").mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: setThemeMock,
      themes: ["light", "dark"],
    } as any);

    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when current theme is dark and clicked", () => {
    const setThemeMock = vi.fn();
    vi.spyOn(nextThemes, "useTheme").mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: setThemeMock,
      themes: ["light", "dark"],
    } as any);

    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledWith("light");
  });
});
