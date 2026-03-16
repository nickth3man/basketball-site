// @vitest-environment jsdom

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

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatsTable } from './stats-table';

describe('StatsTable', () => {
  // Test data
  const columns = [
    { key: 'name', label: 'Name', link: { type: 'player' as const, valueKey: 'bref_id' } },
    { key: 'pts', label: 'Points', align: 'right' as const },
  ];
  const rows = [
    { bref_id: 'jamesle01', name: 'LeBron', pts: 25 },
    { bref_id: 'curryst01', name: 'Steph', pts: 30 },
  ];

  beforeEach(() => {
    window.history.replaceState(null, '', '/leaders');
  });

  /**
   * Verifies that the table renders with all data visible.
   */
  it('renders the table correctly', () => {
    render(<StatsTable columns={columns} rows={rows} />);
    expect(screen.getByRole('link', { name: 'LeBron' })).toHaveAttribute(
      'href',
      '/players/j/jamesle01'
    );
    expect(screen.getByText('Steph')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  /**
   * Verifies sorting functionality:
   * - Initial sort defaults to first column descending
   * - Clicking a header toggles sort direction
   * - Clicking a different column changes sort key
   */
  it('sorts rows by clicking header', () => {
    // Initial sort defaults to columns[0].key ("name") and direction "desc"
    render(<StatsTable columns={columns} rows={rows} />);

    // Name desc: Steph, then LeBron
    let tableRows = screen.getAllByRole('row').slice(1);
    expect(tableRows[0]).toHaveTextContent('Steph');
    expect(tableRows[1]).toHaveTextContent('LeBron');

    // Click Name header to toggle to "asc"
    fireEvent.click(screen.getByRole('button', { name: /Name/i }));
    tableRows = screen.getAllByRole('row').slice(1);
    expect(tableRows[0]).toHaveTextContent('LeBron');
    expect(tableRows[1]).toHaveTextContent('Steph');

    // Click Points header (sets sortKey to "pts" and direction to "desc")
    fireEvent.click(screen.getByRole('button', { name: /Points/i }));
    tableRows = screen.getAllByRole('row').slice(1);
    expect(tableRows[0]).toHaveTextContent('Steph'); // 30
    expect(tableRows[1]).toHaveTextContent('LeBron'); // 25
  });

  it('persists sort state to the URL when tableId is present', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    render(<StatsTable columns={columns} rows={rows} tableId="leaders" />);

    fireEvent.click(screen.getByRole('button', { name: /Points/i }));

    expect(replaceStateSpy).toHaveBeenLastCalledWith(
      null,
      '',
      '/leaders?leaders-sort=pts&leaders-dir=desc'
    );
  });

  /**
   * Verifies CSV export functionality:
   * - Creates a Blob with correct MIME type
   * - Uses URL.createObjectURL for download
   * - Triggers anchor click for download
   * - Cleans up blob URL after delay
   */
  it('exports CSV data through Blob download', () => {
    vi.useFakeTimers();

    const createObjectURL = vi.fn((_blob: Blob | MediaSource) => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    render(<StatsTable columns={columns} rows={rows} />);

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const firstCall = createObjectURL.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error('Expected URL.createObjectURL to be called at least once');
    }
    const blobArg = firstCall[0];
    expect(blobArg).toBeInstanceOf(Blob);
    if (!(blobArg instanceof Blob)) {
      throw new Error('Expected URL.createObjectURL to be called with a Blob');
    }
    expect(blobArg.type).toBe('text/csv;charset=utf-8');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('renders safely with no columns', () => {
    render(<StatsTable columns={[]} rows={rows} />);
    expect(screen.queryByRole('button', { name: /Export CSV/i })).not.toBeInTheDocument();
  });

  it('hydrates sort state from the URL when tableId is present', () => {
    window.history.replaceState(null, '', '/leaders?leaders-sort=pts&leaders-dir=asc');

    render(<StatsTable columns={columns} rows={rows} tableId="leaders" />);

    const tableRows = screen.getAllByRole('row').slice(1);
    expect(tableRows[0]).toHaveTextContent('LeBron');
    expect(tableRows[1]).toHaveTextContent('Steph');
  });
});
