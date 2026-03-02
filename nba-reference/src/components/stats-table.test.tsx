import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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

  it("generates correct CSV export link", () => {
    render(<StatsTable columns={columns} rows={rows} />);
    const exportLink = screen.getByText("Export CSV") as HTMLAnchorElement;
    expect(exportLink).toBeInTheDocument();
    expect(exportLink.getAttribute("download")).toBe("table-export.csv");
    
    const href = decodeURIComponent(exportLink.href);
    expect(href).toContain("Name,Points");
    expect(href).toContain('"Steph","30"');
    expect(href).toContain('"LeBron","25"');
  });
});
