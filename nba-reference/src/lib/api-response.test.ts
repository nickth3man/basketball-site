import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createApiJsonResponse,
  createApiErrorResponse,
  createApiOptionsResponse,
  parseApiJsonBody,
  logApiError,
} from '@/lib/api-response';
import * as loggerModule from '@/lib/logger';

// Mock the logger module
vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

function createMockRequest(body?: unknown): NextRequest {
  const url = 'http://localhost:3000/api/test';
  if (body !== undefined) {
    return new NextRequest(url, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new NextRequest(url, { method: 'GET' });
}

describe('createApiJsonResponse', () => {
  it('returns 200 with JSON body and correct headers', () => {
    const req = createMockRequest();
    const body = { data: 'test', count: 42 };
    const response = createApiJsonResponse(req, body);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
  });

  it('returns custom status when provided', () => {
    const req = createMockRequest();
    const response = createApiJsonResponse(req, { created: true }, { status: 201 });

    expect(response.status).toBe(201);
  });

  it('merges additional headers with default headers', () => {
    const req = createMockRequest();
    const response = createApiJsonResponse(
      req,
      { data: 'test' },
      {
        headers: { 'X-Custom-Header': 'custom-value' },
      }
    );

    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('createApiErrorResponse', () => {
  it('returns correct status code and error shape', async () => {
    const req = createMockRequest();
    const response = createApiErrorResponse(req, 404, 'not_found', 'Resource not found');

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const body = (await response.json()) as ApiErrorResponse;
    expect(body).toEqual({
      error: {
        code: 'not_found',
        message: 'Resource not found',
      },
    });
  });

  it('returns 400 for bad request errors', async () => {
    const req = createMockRequest();
    const response = createApiErrorResponse(req, 400, 'invalid_input', 'Invalid input provided');

    expect(response.status).toBe(400);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error.code).toBe('invalid_input');
    expect(body.error.message).toBe('Invalid input provided');
  });

  it('returns 500 for server errors', async () => {
    const req = createMockRequest();
    const response = createApiErrorResponse(req, 500, 'server_error', 'Internal server error');

    expect(response.status).toBe(500);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error.code).toBe('server_error');
    expect(body.error.message).toBe('Internal server error');
  });
});

describe('createApiOptionsResponse', () => {
  it('returns 204 with CORS headers', () => {
    const response = createApiOptionsResponse();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, Authorization, Accept, Accept-Encoding'
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns null body', () => {
    const response = createApiOptionsResponse();
    expect(response.body).toBeNull();
  });
});

describe('parseApiJsonBody', () => {
  it('resolves with valid JSON', async () => {
    const req = createMockRequest({ name: 'test', value: 123 });
    const result = await parseApiJsonBody(req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toEqual({ name: 'test', value: 123 });
    }
  });

  it('rejects with invalid JSON', async () => {
    const req = createMockRequest('not valid json');
    const result = await parseApiJsonBody(req);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as ApiErrorResponse;
      expect(body.error.code).toBe('invalid_json');
    }
  });

  it('uses custom invalidJsonMessage when provided', async () => {
    const req = createMockRequest('not valid json');
    const customMessage = 'Please provide a valid JSON payload';
    const result = await parseApiJsonBody(req, customMessage);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = (await result.response.json()) as ApiErrorResponse;
      expect(body.error.message).toBe(customMessage);
    }
  });

  it('rejects when body is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', { method: 'POST' });
    const result = await parseApiJsonBody(req);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});

describe('logApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls logger with correct metadata format for Error instances', () => {
    const error = new TypeError('Something went wrong');
    logApiError('test-route', error, { userId: '123' });

    expect(loggerModule.logError).toHaveBeenCalledWith(
      'api:test-route failed',
      expect.objectContaining({
        userId: '123',
        errorName: 'TypeError',
        error: 'Something went wrong',
      })
    );
  });

  it('handles non-Error values correctly', () => {
    logApiError('search', 'string error');

    expect(loggerModule.logError).toHaveBeenCalledWith(
      'api:search failed',
      expect.objectContaining({
        errorName: 'UnknownError',
        error: 'string error',
      })
    );
  });

  it('handles null metadata gracefully', () => {
    const error = new Error('Test error');
    logApiError('grid', error, { extra: null, flag: undefined });

    expect(loggerModule.logError).toHaveBeenCalledWith(
      'api:grid failed',
      expect.objectContaining({
        errorName: 'Error',
        error: 'Test error',
        extra: null,
        flag: undefined,
      })
    );
  });

  it('works without metadata', () => {
    const error = new Error('No metadata');
    logApiError('health', error);

    expect(loggerModule.logError).toHaveBeenCalledWith(
      'api:health failed',
      expect.objectContaining({
        errorName: 'Error',
        error: 'No metadata',
      })
    );
  });
});
