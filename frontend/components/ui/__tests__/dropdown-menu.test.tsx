import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu";

describe("DropdownMenu Component", () => {
  it("renders DropdownMenuLabel directly inside DropdownMenuContent without crashing", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="custom-label" inset>
            My Account
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const label = screen.getByText("My Account");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("data-slot", "dropdown-menu-label");
    expect(label).toHaveAttribute("data-inset", "true");
    expect(label).toHaveClass("custom-label");
  });
});
