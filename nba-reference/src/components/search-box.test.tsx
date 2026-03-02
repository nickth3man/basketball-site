import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchBox } from "./search-box";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SearchBox", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates input value on change", () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "LeBron" } });
    expect(input.value).toBe("LeBron");
  });

  it("fetches results after debounce when q.length >= 2", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ type: "player", id: "lebron-james", label: "LeBron James" }],
      }),
    });

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);
    
    fireEvent.change(input, { target: { value: "Le" } });
    
    // Fast-forward time and wait for async tasks
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/search?q=Le"),
      expect.any(Object)
    );

    // Give it one more microtask for the state update after fetch
    await act(async () => {
       await Promise.resolve();
    });

    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText("player")).toBeInTheDocument();
    
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/players/lebron-james");
  });

  it("renders team results with correct link", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ type: "team", id: "LAL", label: "Lakers" }],
      }),
    });

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);
    
    fireEvent.change(input, { target: { value: "Lak" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Give it one more microtask for the state update after fetch
    await act(async () => {
       await Promise.resolve();
    });

    expect(screen.getByText("Lakers")).toBeInTheDocument();
    expect(screen.getByText("team")).toBeInTheDocument();
    
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/teams/LAL");
  });

  it("does not fetch if query is less than 2 chars", async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);
    fireEvent.change(input, { target: { value: "L" } });
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
