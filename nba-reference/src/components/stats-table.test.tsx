import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatsTable } from "./stats-table";

describe("StatsTable", () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "pts", label: "Points", align: "right" as const },
  ];
  const rows = [
    { name: "LeBron", pts: 25 },
    { name: "Steph", pts: 30 },
  ];

  it("renders the table correctly", () => {
    render(<StatsTable columns={columns} rows={rows} />);
    expect(screen.getByText("LeBron")).toBeInTheDocument();
    expect(screen.getByText("Steph")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

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

  it("exports CSV data through Blob download", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    render(<StatsTable columns={columns} rows={rows} />);

    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe("text/csv;charset=utf-8");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
