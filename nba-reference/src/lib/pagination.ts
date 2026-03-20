export interface PaginationState<T> {
  currentPage: number;
  endItem: number;
  items: T[];
  pageSize: number;
  startItem: number;
  totalItems: number;
  totalPages: number;
}

export type PaginationToken = number | 'ellipsis';

export function coercePageNumber(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number
): PaginationState<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safeCurrentPage = Math.min(Math.max(1, Math.floor(currentPage)), totalPages);
  const startIndex = (safeCurrentPage - 1) * safePageSize;
  const pageItems = items.slice(startIndex, startIndex + safePageSize);
  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = totalItems === 0 ? 0 : startIndex + pageItems.length;

  return {
    currentPage: safeCurrentPage,
    endItem,
    items: pageItems,
    pageSize: safePageSize,
    startItem,
    totalItems,
    totalPages,
  };
}

export function buildPaginationTokens(
  currentPage: number,
  totalPages: number,
  surroundingCount = 1
): PaginationToken[] {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([1, totalPages]);
  const start = Math.max(1, currentPage - surroundingCount);
  const end = Math.min(totalPages, currentPage + surroundingCount);

  for (let page = start; page <= end; page += 1) {
    pages.add(page);
  }

  const sortedPages = Array.from(pages).sort((left, right) => left - right);
  const tokens: PaginationToken[] = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previousPage = sortedPages[index - 1];

    if (page == null) {
      continue;
    }

    if (previousPage != null && page - previousPage > 1) {
      tokens.push('ellipsis');
    }

    tokens.push(page);
  }

  return tokens;
}
