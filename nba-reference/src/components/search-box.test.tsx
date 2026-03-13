// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from './search-box';

interface SearchResult {
  type: 'player' | 'team';
  id: string;
  label: string;
}

function createSearchResponse(results: SearchResult[]): Response {
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SearchBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('updates input value on change', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText<HTMLInputElement>(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'LeBron' } });

    expect(input.value).toBe('LeBron');
  });

  it('fetches results after debounce when q.length >= 2', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        createSearchResponse([{ type: 'player', id: 'lebron-james', label: 'LeBron James' }])
      );

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'Le' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=Le'),
      expect.any(Object)
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('LeBron James')).toBeInTheDocument();
    expect(screen.getByText('player')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /LeBron James/i })).toHaveAttribute(
      'href',
      '/players/l/lebron-james'
    );
  });

  it('renders team results with correct link', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSearchResponse([{ type: 'team', id: 'LAL', label: 'Lakers' }])
    );

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'Lak' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('team')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lakers/i })).toHaveAttribute('href', '/teams/LAL');
  });

  it('does not fetch if query is less than 2 chars', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createSearchResponse([]));

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'L' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('cancels pending requests on cleanup', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createSearchResponse([]));

    const { unmount } = render(<SearchBox />);
    const input = screen.getByPlaceholderText<HTMLInputElement>(/Search players or teams/i);

    fireEvent.change(input, { target: { value: 'LeBron' } });
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
