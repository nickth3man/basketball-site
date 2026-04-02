import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('suppresses debug logs in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { logDebug } = await import('./logger');
    logDebug('should stay quiet');

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('emits info logs in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { logInfo } = await import('./logger');
    logInfo('ready', { season: '2024-25' });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"season":"2024-25"'));
  });

  it('uses warn logging and normalized SQL for slow queries', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { logQuery } = await import('./logger');
    logQuery('SELECT  *\nFROM   players\tWHERE bref_id = ?', 250.127, false);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Query executed'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('"durationMs":250.13'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"sql":"SELECT * FROM players WHERE bref_id = ?"')
    );
  });

  it('falls back to safe context output when serialization fails', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const circularContext: Record<string, unknown> = {};
    circularContext['self'] = circularContext;

    const { logError } = await import('./logger');
    logError('circular context', circularContext);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('"contextSerialization":"failed"')
    );
  });
});
