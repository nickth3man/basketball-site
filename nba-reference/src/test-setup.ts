import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock 'server-only' so tests can import server-side modules
vi.mock('server-only', () => ({}));

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }

  vi.useRealTimers();
});
