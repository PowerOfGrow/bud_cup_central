import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("should render loading message", () => {
    render(<LoadingState message="Chargement..." />);
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("should render default message if none provided", () => {
    render(<LoadingState />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it("should have accessible loading indicator", () => {
    const { container } = render(<LoadingState message="Test" />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

