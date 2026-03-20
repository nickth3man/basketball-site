// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from './search-box';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

interface SearchResult {
  description: string | null;
  href: string;
  id: string;
  label: string;
  type: 'player' | 'team' | 'season' | 'game' | 'award' | 'page';
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
    pushMock.mockReset();
  });

  it('updates input value on change', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText<HTMLInputElement>(
      /Search players, teams, seasons, games, awards, pages/i
    );

    fireEvent.change(input, { target: { value: 'LeBron' } });

    expect(input.value).toBe('LeBron');
  });

  it('fetches results after debounce when q.length >= 2', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSearchResponse([
        {
          type: 'player',
          id: 'lebron-james',
          label: 'LeBron James',
          href: '/players/l/lebron-james',
          description: 'F · Active',
        },
      ])
    );

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(
      /Search players, teams, seasons, games, awards, pages/i
    );

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
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /LeBron James/i })).toHaveAttribute(
      'href',
      '/players/l/lebron-james'
    );
    expect(screen.getByText(/View all results for "Le"/i)).toHaveAttribute('href', '/search?q=Le');
  });

  it('renders team and season results with their links', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createSearchResponse([
        {
          type: 'team',
          id: 'LAL',
          label: 'Lakers',
          href: '/teams/LAL',
          description: 'West · Pacific',
        },
        {
          type: 'season',
          id: '2024-25',
          label: '2024-25',
          href: '/leagues/NBA_2025',
          description: 'NBA season · 2024-2025',
        },
      ])
    );

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(
      /Search players, teams, seasons, games, awards, pages/i
    );

    fireEvent.change(input, { target: { value: 'Lak' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Lakers')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Season')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lakers/i })).toHaveAttribute('href', '/teams/LAL');
    expect(screen.getByRole('option', { name: /2024-25/i })).toHaveAttribute(
      'href',
      '/leagues/NBA_2025'
    );
  });

  it('does not fetch if query is less than 2 chars', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createSearchResponse([]));

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(
      /Search players, teams, seasons, games, awards, pages/i
    );

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
    const input = screen.getByPlaceholderText<HTMLInputElement>(
      /Search players, teams, seasons, games, awards, pages/i
    );

    fireEvent.change(input, { target: { value: 'LeBron' } });
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('submits to the search results page on enter when no option is active', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText<HTMLInputElement>(
      /Search players, teams, seasons, games, awards, pages/i
    );

    fireEvent.change(input, { target: { value: 'Jordan' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/search?q=Jordan');
  });
});
