type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown> | undefined;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getMinLevel()];
}

function formatEntry(entry: LogEntry): string {
  const { level, message, timestamp, context } = entry;
  const parts = [`[${level.toUpperCase()}]`, timestamp, message];
  if (context != null && Object.keys(context).length > 0) {
    parts.push(formatContext(context));
  }
  return parts.join(' ');
}

function formatContext(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context);
  } catch {
    return JSON.stringify({
      contextSerialization: 'failed',
      contextType: Object.prototype.toString.call(context),
    });
  }
}

function emit(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;
  const formatted = formatEntry(entry);
  switch (entry.level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
    case 'debug':
      console.log(formatted);
      break;
  }
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  emit({
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  });
}

export function logDebug(message: string, context?: Record<string, unknown>): void {
  log('debug', message, context);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  log('info', message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  log('warn', message, context);
}

export function logError(message: string, context?: Record<string, unknown>): void {
  log('error', message, context);
}

export function logQuery(sql: string, durationMs: number, cacheHit: boolean): void {
  const trimmed = sql.replace(/\s+/g, ' ').trim();
  const level: LogLevel = durationMs > 200 ? 'warn' : 'debug';
  log(level, `Query ${cacheHit ? 'cache hit' : 'executed'}`, {
    durationMs: Math.round(durationMs * 100) / 100,
    sql: trimmed.slice(0, 200),
    cacheHit,
  });
}
