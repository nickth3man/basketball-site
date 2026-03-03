/**
 * @fileoverview Unit tests for the StatsTable component.
 * 
 * Tests the sortable data table functionality:
 * - Basic rendering of data rows
 * - Column header click sorting (ascending/descending toggle)
 * - CSV export via Blob download
 * - Proper handling of different data types
 * 
 * Uses Vitest with fake timers for blob cleanup verification.
 * 
 * @module @/components/stats-table.test
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatsTable } from "./stats-table";

describe("StatsTable", () => {
  // Test data
  const columns = [
    { key: "name", label: "Name" },
    { key: "pts", label: "Points", align: "right" as const },
  ];
  const rows = [
    { name: "LeBron", pts: 25 },
    { name: "Steph", pts: 30 },
  ];

  /**
   * Verifies that the table renders with all data visible.
   */
  it("renders the table correctly", () => {
    render(<StatsTable columns={columns} rows={rows} />);
    expect(screen.getByText("LeBron")).toBeInTheDocument();
    expect(screen.getByText("Steph")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  /**
   * Verifies sorting functionality:
   * - Initial sort defaults to first column descending
   * - Clicking a header toggles sort direction
   * - Clicking a different column changes sort key
   */
  it("sorts rows by clicking header", () => {
    // Initial sort defaults to columns[0].key ("name") and direction "desc"
    render(<StatsTable columns={columns} rows={rows} />);

    // Name desc: Steph, then LeBron
    let tableRows = screen.getAllByRole("row").slice(1);
    expect(tableRows[0]).toHaveTextContent("Steph");
    expect(tableRows[1]).toHaveTextContent("LeBron");

    // Click Name header to toggle to "asc"
    fireEvent.click(screen.getByRole("button", { name: /Name/i }));
    tableRows = screen.getAllByRole("row").slice(1);
    expect(tableRows[0]).toHaveTextContent("LeBron");
    expect(tableRows[1]).toHaveTextContent("Steph");

    // Click Points header (sets sortKey to "pts" and direction to "desc")
    fireEvent.click(screen.getByRole("button", { name: /Points/i }));
    tableRows = screen.getAllByRole("row").slice(1);
    expect(tableRows[0]).toHaveTextContent("Steph"); // 30
    expect(tableRows[1]).toHaveTextContent("LeBron"); // 25
  });

  /**
   * Verifies CSV export functionality:
   * - Creates a Blob with correct MIME type
   * - Uses URL.createObjectURL for download
   * - Triggers anchor click for download
   * - Cleans up blob URL after delay
   */
  it("exports CSV data through Blob download", () => {
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const createObjectURL = vi.fn((_blob: Blob | MediaSource) => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    render(<StatsTable columns={columns} rows={rows} />);

    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const firstCall = createObjectURL.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error(
        "Expected URL.createObjectURL to be called at least once",
      );
    }
    const blobArg = firstCall[0];
    expect(blobArg).toBeInstanceOf(Blob);
    if (!(blobArg instanceof Blob)) {
      throw new Error("Expected URL.createObjectURL to be called with a Blob");
    }
    expect(blobArg.type).toBe("text/csv;charset=utf-8");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
