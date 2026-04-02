# Code Audit Report



## Executive Summary

| Metric | Value |
|---|---|
| **Overall Health Score** | 6/10 |
| **Critical Issues** | 1 |
| **High Priority Issues** | 3 |
| **Medium Priority Issues** | 8 |
| **Low Priority Issues** | 7 |

> **Oracle review applied** — H-03 demoted to Medium (read-only endpoint), M-04 demoted to Low (three defense layers), L-03 promoted to Medium (PII exposure risk), 3 new findings added. Score adjusted from 7 → 6 reflecting unguarded newsletter subsystem and ~1,400 lines of untested writable-path code.

### Top 3 Priorities
1. **Unsubscribe token exposed in subscribe response** — Security — The `unsubscribe_token` is returned to the client in the subscribe response, creating a potential token-theft vector.
2. **Wildcard CORS on all API routes** — Security — `Access-Control-Allow-Origin: *` on every API endpoint, including newsletter subscribe/unsubscribe, allowing cross-origin abuse.
3. **No rate limiting on newsletter subscribe endpoint** — Security — No rate-limiting middleware or per-route throttling; newsletter subscribe endpoint is unprotected against bulk subscription attacks.

### ⚠️ Compounding Risk: C-01 + H-01 + H-02
These three findings combine into a **single attack chain**: an attacker can programmatically subscribe thousands of emails from any website (H-01 wildcard CORS), collect all unsubscribe tokens from the responses (C-01), and silently unsubscribe anyone at will — all without rate limiting (H-02). **Treat these as a coordinated fix.** Removing `unsubscribe_token` from the subscribe response (C-01) breaks the chain immediately even before rate limiting and CORS are addressed.

### What's Working Well
- **Disciplined TypeScript**: Strict config (`ignoreBuildErrors: false`), no `any`, no non-null assertions, explicit exported return types — enforced by convention and tooling.
- **Clean layered architecture**: Three-layer data model (db.ts → queries/ → query/) with clear boundary enforcement via AGENTS.md at every level.
- **Comprehensive security headers**: CSP, HSTS (2-year preload), X-Frame-Options DENY, COOP/COEP, Referrer-Policy, Permissions-Policy — all configured in `next.config.ts`.
- **Strong test discipline**: 227 tests across 23 files, all passing; CI pipeline (type-check → lint → format:check → test) runs clean.
- **Defense-in-depth input validation**: `validation.ts` provides regex-based guards for BRef IDs, team abbreviations, season IDs, and positive integers, calling `notFound()` on invalid input.
- **CSV formula injection protection**: `csv.ts` prefixes `=+@-` characters with a single quote — a rare, proactive defense.

---

## Findings

### 🔴 Critical

#### [C-01] Unsubscribe token returned in subscribe API response
- **File**: `src/app/api/newsletter/subscribe/route.ts:79-82`
- **Category**: Security
- **Issue**: The subscribe endpoint returns the `unsubscribe_token` in its JSON response body. This token is a secret that should only be known to the subscriber via email. Returning it in the HTTP response means any attacker who can trigger a subscription (or intercept the response) obtains the token and can unsubscribe any victim.
- **Impact**: An attacker subscribes a victim's email, captures the `unsubscribe_token` from the response, and then calls the unsubscribe endpoint — silently removing the victim from the newsletter without their knowledge.
- **Evidence**:
  ```typescript
  return createApiJsonResponse(req, {
    status: result.isNew ? 'subscribed' : 'already_subscribed',
    unsubscribe_token: result.subscriber.unsubscribe_token,  // ← exposed
  });
  ```
- **Recommendation**: Do not return `unsubscribe_token` in the response body. Instead, send the token exclusively via email. If a confirmation response is needed, return only a boolean `subscribed: true` field. If a "manage preferences" UI needs the token, send it in a separate authenticated flow (e.g., email link with embedded token).
- **Effort**: Small (<30 min)

### 🟠 High Priority

#### [H-01] Wildcard CORS on all API routes including write endpoints
- **File**: `src/lib/api-headers.ts:2` and `next.config.ts:64`
- **Category**: Security
- **Issue**: All API routes respond with `Access-Control-Allow-Origin: *`. This includes the newsletter subscribe/unsubscribe endpoints which handle PII (email addresses) and perform writes. A wildcard CORS policy on write endpoints allows any website to make cross-origin requests to subscribe/unsubscribe users.
- **Impact**: A malicious site could trigger subscriptions or unsubscribes cross-origin, or probe whether specific email addresses are subscribed.
- **Evidence**:
  ```typescript
  // src/lib/api-headers.ts
  export const API_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  ```
- **Recommendation**: Restrict CORS to the actual frontend origin on write endpoints (subscribe, unsubscribe). Keep wildcard CORS only on read-only routes (search, export, grid). Move to an allowlist-based approach:
  ```typescript
  const ALLOWED_ORIGINS = ['https://nba-reference.com', 'http://localhost:3000'];
  ```
- **Effort**: Small (<30 min)

#### [H-02] No rate limiting on newsletter subscribe endpoint
- **File**: `src/app/api/newsletter/subscribe/route.ts`
- **Category**: Security
- **Issue**: The subscribe endpoint accepts POST requests with no rate limiting. An attacker could flood the subscriber database with thousands of email addresses.
- **Impact**: Database pollution, potential disk exhaustion, abuse of the email list. The `UNIQUE` constraint on email prevents duplicate rows but each unique address still inserts.
- **Evidence**: No `rate_limit`, no middleware throttle, no `X-RateLimit-*` headers found anywhere in the codebase.
- **Recommendation**: Add per-IP rate limiting to the subscribe endpoint. Options:
  1. Use a Next.js middleware with an in-memory rate limiter (e.g., `rate-limiter-flexible`).
  2. Add a simple per-IP counter in the route handler with a short TTL.
  3. At minimum, add request deduplication via a short cache.
- **Effort**: Medium (1-4 hrs)

#### [M-07] No rate limiting on search API endpoint *(demoted from High per Oracle review)*
- **File**: `src/app/api/search/route.ts`
- **Category**: Performance
- **Issue**: The search endpoint performs database queries (including LIKE queries across players, teams, seasons, and games tables) with no rate limiting. An attacker or bot could trigger expensive full-table scans at high volume.
- **Impact**: Database CPU saturation, increased latency for legitimate users, potential memory pressure from large result sets. This is a read-only endpoint against a read-only SQLite file — worst case is increased latency, not data corruption or PII exposure. The 2-char minimum query length and `SEARCH_API_RESULT_LIMIT` provide basic guardrails.
- **Evidence**: The `searchEntities` function runs multiple LIKE queries across 4 tables. Only mitigation is a 2-character minimum query length and a `SEARCH_API_RESULT_LIMIT` constant.
- **Recommendation**: Add per-IP rate limiting (e.g., 30 req/min). Consider adding a query length or complexity threshold above which results are cached for a short TTL. Lower priority than newsletter subscribe rate limiting.
- **Effort**: Medium (1-4 hrs)

#### [H-04] CSP allows `unsafe-eval` and `unsafe-inline` for scripts
- **File**: `next.config.ts:13-14`
- **Category**: Security
- **Issue**: The Content-Security-Policy includes `script-src 'self' 'unsafe-eval' 'unsafe-inline'` which significantly weakens XSS protection. If any markdown-rendered content contains an XSS payload, the browser will execute it.
- **Impact**: `unsafe-inline` negates CSP's ability to block inline script injection. Combined with the `dangerouslySetInnerHTML` usage in blog/podcast pages, any markdown content compromise becomes a direct XSS vector.
- **Evidence**:
  ```
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  ```
- **Recommendation**: Remove `'unsafe-inline'` and `'unsafe-eval'` from the CSP. Use nonce-based script loading (Next.js supports this natively). For styles, consider migrating to Tailwind's class-only approach which doesn't require `unsafe-inline`. This may require:
  1. Enabling Next.js nonce-based CSP
  2. Removing any inline `<script>` tags that aren't JSON-LD
  3. Testing that all dynamic styles work without `unsafe-inline`
- **Effort**: Large (1+ days)

### 🟡 Medium Priority

#### [M-01] Untested query modules: awards, standings, playoffs, player-splits
- **File**: `src/lib/queries/awards.ts` (368 lines), `src/lib/queries/standings.ts` (248 lines), `src/lib/queries/playoffs.ts` (390 lines), `src/lib/queries/player-splits.ts` (285 lines)
- **Category**: Testing
- **Issue**: Four of the largest, most complex query modules have no dedicated test files. These modules contain computed SQL (CTEs, CASE expressions, window functions) and in-JS data transformations that are prone to edge-case failures.
- **Impact**: Schema changes or data anomalies in these modules will go undetected until they break in production. The `additional-coverage.test.ts` file provides smoke tests but does not validate business logic edge cases.
- **Evidence**: File listing shows no `awards.test.ts`, `standings.test.ts`, `playoffs.test.ts`, or `player-splits.test.ts`.
- **Recommendation**: Add dedicated unit tests for each module covering: boundary seasons, empty result sets, partial data, computed field edge cases (GB = 0, win% = NaN, etc.).
- **Effort**: Medium (1-4 hrs per module)

#### [M-02] Untested core utility: `api-response.ts`
- **File**: `src/lib/api-response.ts` (92 lines)
- **Category**: Testing
- **Issue**: The shared API response helper module (used by all 8+ API routes) has no test file. If error message formatting or CORS header behavior regresses, every API endpoint is affected.
- **Impact**: All API routes depend on this module. Any regression affects error handling, CORS headers, and response formatting across the entire API surface.
- **Evidence**: No `api-response.test.ts` found.
- **Recommendation**: Add unit tests covering: successful JSON response, error response with status codes, OPTIONS preflight, parseApiJsonBody with valid/invalid JSON, logApiError output format.
- **Effort**: Small (<30 min)

#### [M-03] Untested writable DB module: `newsletter-db.ts`
- **File**: `src/lib/newsletter-db.ts` (275 lines)
- **Category**: Testing
- **Issue**: The only writable database module in the entire application — handling subscriber PII, token generation, reactivation logic — has no dedicated test file. The route tests mock `addSubscriber` but never test the actual database operations.
- **Impact**: Token generation bugs, reactivation edge cases, schema migration failures, and race conditions in the subscriber logic are completely untested at the DB layer.
- **Evidence**: No `newsletter-db.test.ts` found. Route tests (`subscribe/__tests__/route.test.ts`) mock the `newsletter-db` module.
- **Recommendation**: Add integration tests using an in-memory or temp SQLite file covering: new subscription, re-subscription (idempotent), unsubscribed-then-resubscribe reactivation, token uniqueness, email case insensitivity, empty token rejection.
- **Effort**: Medium (1-4 hrs)

#### [L-06] `dangerouslySetInnerHTML` for markdown content rendering *(demoted from Medium per Oracle review)*
- **File**: `src/app/blog/[slug]/page.tsx:142`, `src/app/podcast/[slug]/page.tsx`
- **Category**: Security
- **Issue**: Blog and podcast pages render markdown-sourced HTML via `dangerouslySetInnerHTML`. Three layers of defense exist: (1) content is repo-owned (committed by maintainers), (2) `remark-html` with `sanitize: true` strips dangerous HTML, (3) content files aren't user-uploadable. This is the standard Next.js pattern for markdown rendering.
- **Impact**: The only theoretical vector is a supply-chain attack on `remark-html` or `gray-matter`, combined with `unsafe-inline` CSP. Probability is very low for a personal stats site.
- **Evidence**:
  ```tsx
  <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }} />
  ```
  The `remark-html` plugin is configured with `sanitize: true`.
- **Recommendation**: Acceptable risk. Document the decision with a comment. If CSP is tightened (H-04), this becomes even lower risk.
- **Effort**: Documentation only

#### [M-05] Sync filesystem calls in `content.ts` (Server Component)
- **File**: `src/lib/content.ts:82-86,96,119,128,171-172,185,211,220`
- **Category**: Performance
- **Issue**: The content module uses `fs.existsSync`, `fs.readdirSync`, and `fs.readFileSync` extensively. While these run in Server Components (not blocking the event loop in the traditional sense), they are synchronous I/O operations that could slow down page rendering, especially with many content files.
- **Impact**: In development with hot-reloading, every blog/podcast page request reads all files synchronously. With many content files, this adds latency to every request.
- **Evidence**:
  ```typescript
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const raw = fs.readFileSync(fullPath, 'utf8');
  ```
- **Recommendation**: Consider caching the file list and parsed content at module level (since content only changes at rebuild time in production). In development, the sync calls are acceptable for a small number of files. For now, document this as an intentional trade-off.
- **Effort**: Low (documentation only)

#### [M-06] Newsletter subscribe error handler logs `email: undefined`
- **File**: `src/app/api/newsletter/subscribe/route.ts:84`
- **Category**: Quality
- **Issue**: The catch block explicitly sets `email: undefined` in the error metadata, which is misleading — it looks like the developer intended to redact the email from logs (good practice) but the `undefined` value is confusing and could mask debugging.
- **Impact**: Minor — the intent is correct (don't log PII in error handlers), but the implementation is unclear.
- **Evidence**:
  ```typescript
  logApiError('newsletter/subscribe', error, {
    email: undefined,  // ← misleading; should omit or use '<redacted>'
  });
  ```
- **Recommendation**: Either omit the `email` field entirely or use a sentinel like `email: '<redacted>'` to make the intent clear.
- **Effort**: Small (<30 min)

#### [M-09] Race condition in `addSubscriber` — concurrent subscribe crashes with 500 *(new — Oracle)*
- **File**: `src/lib/newsletter-db.ts:122-163`
- **Category**: Correctness
- **Issue**: The `addSubscriber` function performs a SELECT to check for existing subscribers, then conditionally INSERTs or UPDATEs. This sequence is not atomic — two concurrent requests for the same new email will both pass the SELECT check, and the second INSERT will fail with a `SqliteError` due to the `UNIQUE` constraint on `email`. The error is not caught and propagates to the route handler's generic catch block, returning a 500 "temporarily unavailable" to the user.
- **Impact**: A valid subscription request returns a confusing 500 error under concurrent access. The user sees "temporarily unavailable" when the operation should have succeeded.
- **Evidence**:
  ```typescript
  // newsletter-db.ts:122-163 — SELECT then conditional INSERT/UPDATE, no transaction
  const existing = db.prepare('SELECT * FROM subscribers WHERE email = ? COLLATE NOCASE').get(email);
  // ... if not existing:
  const info = db.prepare(`INSERT INTO subscribers ...`).run(email, source, preference, token);
  ```
- **Recommendation**: Wrap the SELECT + INSERT/UPDATE in `db.transaction()` (better-sqlite3 supports synchronous transactions natively). Alternatively, catch the UNIQUE constraint error and treat it as idempotent success (re-select the existing row).
- **Effort**: Small (<30 min)

#### [M-10] No `newsletter.db` file existence validation at startup *(new — Oracle)*
- **File**: `src/lib/newsletter-db.ts:41-48`
- **Category**: Reliability
- **Issue**: The main stats DB (`db.ts`) opens with `fileMustExist: true`, causing an immediate error if the file is missing. The newsletter DB opens with no such check — `better-sqlite3` silently creates a new empty file. If `NEWSLETTER_DB_PATH` is misconfigured, the app creates a fresh DB in an unexpected location with no warning.
- **Impact**: Silent data loss scenario — a misconfigured deploy could create a new empty newsletter.db, losing all subscriber data. The old file remains on disk but is never accessed.
- **Evidence**:
  ```typescript
  // db.ts — safe
  db = new Database(resolveDbPath(), { readonly: true, fileMustExist: true, ... });
  // newsletter-db.ts — no fileMustExist
  newsletterDb = new Database(resolveNewsletterDbPath());
  ```
- **Recommendation**: Add a startup validation that logs a warning when creating a new file vs. opening an existing one. Consider adding `fileMustExist: true` in production and only allowing creation in development/test.
- **Effort**: Small (<1 hr)

### 🟢 Low Priority / Improvements

#### [L-06] `dangerouslySetInnerHTML` for markdown content rendering *(demoted from Medium per Oracle review)*
- **File**: `src/app/blog/[slug]/page.tsx:142`, `src/app/podcast/[slug]/page.tsx`
- **Category**: Security
- **Issue**: Blog and podcast pages render markdown-sourced HTML via `dangerouslySetInnerHTML`. Three layers of defense exist: (1) content is repo-owned (committed by maintainers), (2) `remark-html` with `sanitize: true` strips dangerous HTML, (3) content files aren't user-uploadable. This is the standard Next.js pattern for markdown rendering.
- **Impact**: The only theoretical vector is a supply-chain attack on `remark-html` or `gray-matter`, combined with `unsafe-inline` CSP. Probability is very low for a personal stats site.
- **Evidence**:
  ```tsx
  <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }} />
  ```
  The `remark-html` plugin is configured with `sanitize: true`.
- **Recommendation**: Acceptable risk. Document the decision with a comment. If CSP is tightened (H-04), this becomes even lower risk.
- **Effort**: Documentation only

#### [L-07] `unsubscribeByToken` doesn't validate token format *(new — Oracle)*
- **File**: `src/lib/newsletter-db.ts:173`
- **Category**: Quality
- **Issue**: The function only checks `token.length === 0`. Tokens are 64-char hex strings (`crypto.randomBytes(32).toString('hex')`). Accepting arbitrary-length strings and querying the DB with them is a minor inefficiency — garbage input triggers unnecessary DB lookups.
- **Recommendation**: Add a regex check `/^[0-9a-f]{64}$/` before the DB query. Rejects malformed tokens before they reach SQLite.
- **Effort**: Small (<15 min)

#### [L-08] `logApiError` includes full stack traces in production logs *(new — Oracle)*
- **File**: `src/lib/api-response.ts:90`
- **Category**: Quality
- **Issue**: `error.stack` is logged in full via `logApiError`. If any error message contains user input (e.g., a path-derived error), that input ends up in server logs. For this codebase the risk is minimal because inputs are validated before the try/catch, but it's a good practice to truncate stack traces in production.
- **Recommendation**: Consider truncating `error.stack` to the first 3 frames in production, or omitting it entirely in favor of structured error metadata.
- **Effort**: Documentation only
- **File**: `src/lib/logger.ts:89`
- **Category**: Performance
- **Issue**: The slow query threshold is set to 200ms which is relatively tight for an SQLite database. The test suite shows a query taking ~300ms on a populated database triggering a warning. This may cause log noise in production.
- **Evidence**:
  ```
  [WARN] Query executed {"durationMs":299.89,...}
  ```
- **Recommendation**: Consider raising the threshold to 500ms for a read-only stats database, or making it configurable via an environment variable.
- **Effort**: Small (<30 min)

#### [L-02] `stats-table.tsx` is the longest file at 400 lines
- **File**: `src/components/stats-table.tsx`
- **Category**: Maintainability
- **Issue**: At 400 lines with 26 control flow branches, this is the most complex file in the codebase. It handles sorting, URL sync, CSV export, column visibility, and linkable cells — all in one component.
- **Recommendation**: Consider extracting the CSV export logic and the URL-sync logic into separate hooks/utilities to reduce cognitive load. Not urgent — the file is well-tested (6 tests).
- **Effort**: Medium (1-4 hrs)

#### [M-08] No `server-only` package on data access modules *(promoted from Low per Oracle review)*
- **File**: `src/lib/db.ts`, `src/lib/newsletter-db.ts`
- **Category**: Architecture / Security
- **Issue**: Neither `db.ts` nor `newsletter-db.ts` imports the `server-only` package. While Next.js App Router keeps these server-side by default, adding `import 'server-only'` would provide a build-time error if these modules are ever accidentally imported in a Client Component. The `server-only` package is not currently installed (not in `package.json`).
- **Impact**: Without this guard, a single accidental import of `newsletter-db.ts` into a client component would expose the DB path and all subscriber logic (including token generation) to the client bundle. Given that `newsletter-db.ts` handles PII, this is a meaningful defense-in-depth gap.
- **Recommendation**: Install `server-only` and add `import 'server-only'` to `db.ts` and `newsletter-db.ts`.
- **Effort**: Small (<30 min)

#### [L-04] `import * as queries` wildcard import in test
- **File**: `src/lib/query/page-loaders.test.ts:1`
- **Category**: Quality
- **Issue**: The test file uses `import * as queries from '@/lib/queries'` which imports all 29+ domain modules. This is acceptable for a coverage test but creates tight coupling.
- **Recommendation**: Low priority — the test is intentionally a broad coverage sweep. Consider documenting this intent in a comment.
- **Effort**: Small (<30 min)

#### [L-05] Missing `Content-Security-Policy` header on API routes
- **File**: `next.config.ts:60-71`
- **Category**: Security
- **Issue**: The API route headers section adds CORS headers on top of `securityHeaders` (which includes CSP). This means API responses include a full CSP header, which is unusual for JSON/CSV API endpoints and adds unnecessary response size.
- **Recommendation**: Consider removing CSP from API responses (they're not serving HTML). This is cosmetic and has no security impact.
- **Effort**: Small (<30 min)

---

## Category Deep Dives

### 1. Architecture & Design

The codebase demonstrates **strong architectural discipline** for a personal/learning project:

- **Three-layer data model**: `db.ts` (connection + cache) → `queries/` (domain SQL) → `query/` (page composition) — clean separation with enforced boundaries.
- **AGENTS.md at every level**: Root → nba-reference → app/components/lib/queries — each layer has specific guidance for AI/human contributors.
- **Typed routes**: `typedRoutes: true` in Next.js config with a `routes.ts` helper — prevents broken internal links at build time.
- **Read-only DB by convention**: Only `newsletter-db.ts` opens a writable connection; `db.ts` opens with `readonly: true, fileMustExist: true`.

**Concerns**: The `queries/index.ts` barrel file re-exports 29+ modules with high fan-out (H-01 risk zone). The `content.ts` module uses sync I/O extensively but this is acceptable for Server Components with a small content corpus.

### 2. Code Quality

**Strengths**: TypeScript strict mode enforced, no `any` types found, no `as any` casts in production code, comprehensive JSDoc on all public functions, consistent formatting (Prettier passes clean), ESLint passes clean.

**Concerns**: The `stats-table.tsx` component (400 lines, 26 control flow branches) is the most complex file. The `search-box.tsx` (292 lines, 17 control flow branches) handles debouncing, AbortController, localStorage, and keyboard shortcuts in a single component. Both are tested but could benefit from extraction of concerns.

No `TODO`/`FIXME`/`HACK` markers were found in production code (only in the legacy `scripts/migrate.sh`). Console.log usage is limited to the `logger.ts` module and setup scripts — no debug remnants in production code.

### 3. Security

**Strengths**:
- Comprehensive security headers (CSP, HSTS with preload, X-Frame-Options DENY, COOP/COEP)
- Input validation via `validation.ts` with regex-based guards
- Parameterized SQL queries throughout (no string concatenation found)
- CSV formula injection protection in `csv.ts`
- No hardcoded secrets (only test fixtures)
- `robots.ts` disallows `/api/`
- User-agent logging truncated to 100 chars (log injection mitigation)

**Concerns**:
- The `unsubscribe_token` exposure in the subscribe response is the most significant finding (C-01).
- Wildcard CORS on write endpoints (H-01) enables cross-origin subscription attacks.
- No rate limiting on any endpoint (H-02, M-07).
- CSP with `unsafe-inline` and `unsafe-eval` weakens XSS protection (H-04).
- `dangerouslySetInnerHTML` for markdown rendering (L-06) — mitigated by three defense layers (repo-owned content, `sanitize: true`, no user uploads).
- Race condition in `addSubscriber` (M-09) can cause 500 errors on concurrent subscriptions.
- No startup validation for newsletter DB path (M-10) — misconfiguration silently creates empty DB.

> **⚠️ Compounding risk**: C-01 + H-01 + H-02 together form a single attack chain for unauthenticated PII harvesting + silent unsubscribe DoS. Fix C-01 first to break the chain immediately.

### 4. Performance

**Strengths**:
- LRU query cache (500 entries, 30s TTL) prevents redundant database hits.
- `React.cache()` used in page loaders for request-level deduplication.
- Gzip compression on CSV exports when >1024 bytes.
- Cache-Control headers tuned by route type (60s for dynamic data, 300s for relatively static data).

**Concerns**:
- No rate limiting on search (expensive multi-table LIKE queries) or newsletter subscribe endpoints.
- Sync filesystem calls in `content.ts` — acceptable for small content corpus.
- The 200ms slow query threshold may cause log noise (300ms queries observed in tests).

### 5. Testing

**Strengths**: 227 tests across 23 files, all passing. CI pipeline is comprehensive: type-check → lint → format → test. Tests cover:
- All 4 API routes (search, export, newsletter subscribe/unsubscribe)
- Core utilities (validation, formatters, csv, utils, logger, table-styles)
- Key components (stats-table, search-box)
- Multiple query modules (games, players, teams, seasons)
- Integration smoke tests (additional-coverage)

**Concerns**: Test-to-source ratio is 23:243 (9.5%). Specific gaps:
- `newsletter-db.ts` (275 lines, only writable DB module) — **0 tests**
- `api-response.ts` (92 lines, used by all routes) — **0 tests**
- `awards.ts` (368 lines), `playoffs.ts` (390 lines), `standings.ts` (248 lines), `player-splits.ts` (285 lines) — **0 dedicated tests each**
- `content.ts` (239 lines) — **0 tests**

The `additional-coverage.test.ts` provides smoke tests for some of these but does not validate business logic edge cases.

### 6. Maintainability

**Strengths**:
- Hierarchical AGENTS.md documentation at every layer
- Consistent code style enforced by Prettier + ESLint + husky pre-commit hooks
- Path aliases (`@/*`) for clean imports
- Well-documented public API surface with JSDoc
- Clear separation of concerns enforced by convention

**Concerns**:
- `stats-table.tsx` (400 lines) and `search-box.tsx` (292 lines) are the largest client components and could benefit from extraction.
- The `queries/index.ts` barrel re-export pattern creates tight coupling — any signature change propagates to all consumers.
- No `server-only` guard on data access modules (L-03).

---

## Prioritized Action Plan

> Oracle recommends treating C-01, H-01, and H-02 as a **coordinated fix** — they form a single attack chain. Removing the token from the subscribe response (C-01) breaks the chain immediately.

### Immediate (< 1 hour — breaks attack chains)
- [ ] **[C-01]** `src/app/api/newsletter/subscribe/route.ts:79-82` — Remove `unsubscribe_token` from subscribe response body; send token only via email
- [ ] **[M-08]** `src/lib/db.ts`, `src/lib/newsletter-db.ts` — Install `server-only` package and add `import 'server-only'` as build-time safety guard
- [ ] **[M-09]** `src/lib/newsletter-db.ts:122-163` — Wrap `addSubscriber` SELECT+INSERT/UPDATE in `db.transaction()`

### This week (< 4 hours)
- [ ] **[H-01]** `src/lib/api-headers.ts:2`, `next.config.ts:64` — Restrict CORS on write endpoints (subscribe, unsubscribe) to known origins; keep wildcard on read-only routes
- [ ] **[M-06]** `src/app/api/newsletter/subscribe/route.ts:84` — Fix misleading `email: undefined` in error log metadata
- [ ] **[L-07]** `src/lib/newsletter-db.ts:173` — Add token format regex validation before DB query

### This sprint (1–5 days)
- [ ] **[H-02]** `src/app/api/newsletter/subscribe/route.ts` — Implement per-IP rate limiting on subscribe endpoint
- [ ] **[M-07]** `src/app/api/search/route.ts` — Implement per-IP rate limiting on search endpoint (lower priority than H-02)
- [ ] **[M-03]** `src/lib/newsletter-db.ts` — Add integration tests for the writable DB module (subscribe, reactivate, unsubscribe, token uniqueness)
- [ ] **[M-02]** `src/lib/api-response.ts` — Add unit tests for shared API response helpers
- [ ] **[M-10]** `src/lib/newsletter-db.ts` — Add startup validation for newsletter DB path / file existence
- [ ] **[M-01]** `src/lib/queries/` — Add dedicated unit tests for `awards.ts`, `standings.ts`, `playoffs.ts`, `player-splits.ts`

### Strategic Initiatives (> 5 days)
- [ ] **[H-04]** Remove `unsafe-inline` and `unsafe-eval` from CSP; migrate to nonce-based script loading and Tailwind-only styles
- [ ] **[L-02]** Extract CSV export and URL-sync logic from `stats-table.tsx` into separate hooks to reduce component complexity
- [ ] **[M-05]** Consider caching content module file reads at module level to reduce sync I/O overhead in development

---

## Metrics Dashboard

| Metric | Value |
|---|---|
| Files Analyzed | 268 TypeScript/JavaScript + 6 scripts + 19 markdown |
| Total Lines of Code | ~2.3M (including DB payload); ~29K in app TypeScript |
| Languages Detected | TypeScript (262), JavaScript (6), CSS (1), Markdown (19), Shell (1) |
| Test-to-Source File Ratio | 23:243 (9.5%) |
| Complexity Hotspots (files) | 6 (>250 lines with high control flow density) |
| Security Findings | 🔴 1  🟠 3  🟡 9  🟢 5 |
| TODO / FIXME / HACK Count | 0 / 0 / 0 in production code (6 in legacy `scripts/migrate.sh`) |
| Direct Dependencies | 12 production, 20 dev |
| Avg File Length (LOC) | ~119 lines (TypeScript source) |
| Longest File | `src/components/stats-table.tsx` (400 lines) |
| CI Pipeline | type-check → lint → format → test → build (all passing) |

### Oracle Review — Severity Adjustments & New Findings

The **Oracle review applied** — An addition to the automated sweep findings, Oracle identified three previously missed issues and validated the severity calibrations:

**Severity adjustments:**
| Finding | Original | Oracle Verdict | Reason |
|---|---|---|---|
| H-03 (search rate limiting) | High | **→ Medium** | Read-only endpoint, no PII exposure; result-limit guardrail provides basic protection |
| M-04 (dangerouslySetInnerHTML) | Medium | **→ Low** | Three defense layers: repo-owned content, sanitize: true`, no user uploads |
 Standard Next.js markdown pattern |
| L-03 (server-only guard) | Low | **→ Medium** | `newsletter-db.ts` handles PII; accidental client import exposes DB path + subscriber logic |

**New findings identified by Oracle:**
| ID | Severity | File | Issue |
|---|---|---|---|
| M-09 | Medium | `newsletter-db.ts:122-163` | Race condition: concurrent subscribe for same email → UNIQUE constraint error → uncaught 500 |
| M-10 | Medium | `newsletter-db.ts:41-48` | No `fileMustExist` / startup validation for newsletter DB; misconfigured path creates empty DB silently |
| L-07 | Low | `newsletter-db.ts:173` | `unsubscribeByToken` doesn't validate token format (64-char hex) before DB query |
| L-08 | Low | `api-response.ts:90` | `logApiError` includes full stack traces in production logs |

**Compounding risk assessment (Oracle):**
The individual findings C-01, H-01, and H-02 form a **single coordinated attack chain**: An attacker can programmatically subscribe thousands of emails from any website (H-01 wildcard CORS), → collect all unsubscribe tokens from the responses (C-01) → silently unsubscribe anyone at will (no rate limiting). The These should be fixed as a group, with C-01 addressed first as it breaks the chain immediately.
