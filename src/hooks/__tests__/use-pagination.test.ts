import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "../use-pagination";

describe("usePagination", () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  it("should paginate data correctly", () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1);
  });

  it("should navigate to next page", () => {
    const { result } = renderHook(() =>
      usePagination({ data: mockData, itemsPerPage: 10 })
    );

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData).toHaveLength(10);
  });

  it("should handle empty data", () => {
    const { result } = renderHook(() =>
      usePagination({ data: [], itemsPerPage: 10 })
    );

    expect(result.current.paginatedData).toHaveLength(0);
    expect(result.current.totalPages).toBe(0);
  });

  it("should handle data smaller than page size", () => {
    const smallData = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    const { result } = renderHook(() =>
      usePagination({ data: smallData, itemsPerPage: 10 })
    );

    expect(result.current.paginatedData).toHaveLength(5);
    expect(result.current.totalPages).toBe(1);
  });
});

