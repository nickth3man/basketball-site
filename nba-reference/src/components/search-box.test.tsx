/**
 * @fileoverview Unit tests for the SearchBox component.
 *
 * Tests the client-side search functionality:
 * - Input value updates
 * - Debounced API calls (200ms delay)
 * - Player result rendering and linking
 * - Team result rendering and linking
 * - Minimum query length enforcement (2 characters)
 * - Cleanup of timers and AbortController
 *
 * Uses Vitest with fake timers to control debounce behavior.
 *
 * @module @/components/search-box.test
 */

import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBox } from './search-box';

// Mock fetch for testing API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SearchBox', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Verifies that the input value updates when the user types.
   */
  it('updates input value on change', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'LeBron' } });
    expect(input.value).toBe('LeBron');
  });

  /**
   * Verifies that API calls are debounced by 200ms.
   * Only queries with 2+ characters should trigger API calls.
   */
  it('fetches results after debounce when q.length >= 2', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ type: 'player', id: 'lebron-james', label: 'LeBron James' }],
      }),
    });

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'Le' } });

    // Fast-forward time past the debounce delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=Le'),
      expect.any(Object)
    );

    // Wait for state update after fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('LeBron James')).toBeInTheDocument();
    expect(screen.getByText('player')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/players/lebron-james');
  });

  /**
   * Verifies that team results are rendered correctly
   * with the appropriate link to the team page.
   */
  it('renders team results with correct link', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ type: 'team', id: 'LAL', label: 'Lakers' }],
      }),
    });

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'Lak' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Wait for state update after fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('team')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/teams/LAL');
  });

  /**
   * Verifies that queries shorter than 2 characters don't trigger API calls.
   * This prevents excessive requests for single-character queries.
   */
  it('does not fetch if query is less than 2 chars', async () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);
    fireEvent.change(input, { target: { value: 'L' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * Verifies that pending requests are canceled when the component unmounts
   * or when the query changes (via AbortController).
   */
  it('cancels pending requests on cleanup', async () => {
    // Track AbortController instances to verify abort is called
    const abortSpy = vi.fn();
    const originalAbortController = global.AbortController;

    // Mock AbortController to track abort() calls
    global.AbortController = vi.fn(() => ({
      signal: { aborted: false },
      abort: abortSpy,
    })) as unknown as typeof AbortController;

    const { unmount } = render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    // Trigger a search to create an AbortController
    fireEvent.change(input, { target: { value: 'LeBron' } });

    // Unmount should trigger cleanup which calls abort()
    unmount();

    // Verify abort was called during cleanup
    expect(abortSpy).toHaveBeenCalled();

    // Restore original AbortController
    global.AbortController = originalAbortController;
  });
});
