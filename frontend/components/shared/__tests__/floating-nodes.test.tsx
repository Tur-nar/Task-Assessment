import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FloatingNodes } from "../floating-nodes";

describe("FloatingNodes component", () => {
  it("renders SVG graph canvas with nodes and links", () => {
    const { container } = render(<FloatingNodes />);
    
    // Check SVG is rendered
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("w-full");

    // Check link lines exist
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);

    // Check node circles exist
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);
  });

  it("applies custom className when provided", () => {
    const { container } = render(<FloatingNodes className="custom-test-class" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("custom-test-class");
  });
});
