# Code Audit Report

**Project**: basketball-site
**Date**: March 2, 2026
**Auditor**: OpenCode (automated static analysis)
**Scope**: Full codebase — 6-dimension audit (Filtered to `nba-reference` and `skills` directories, excluding temp/cache folders)

---

## Executive Summary

| Metric | Value |
|---|---|
| **Overall Health Score** | 9.5/10 |
| **Critical Issues** | 0 |
| **High Priority Issues** | 0 |
| **Medium Priority Issues** | 1 |
| **Low Priority Issues** | 2 |

### Top 3 Priorities
1. **[M-01]** — Performance — Synchronous SQLite execution via `better-sqlite3` can block the Node.js event loop under heavy concurrency.
2. **[L-01]** — Quality — In-memory CSV export string concatenation may cause memory pressure on massive datasets.
3. **[L-02]** — Maintainability — Fallback React `key` generation in `StatsTable` could lead to duplicate keys.

### What's Working Well
- **Excellent Security Posture**: `better-sqlite3` is explicitly initialized with `{ readonly: true }`, completely eliminating destructive SQL execution risks.
- **Robust SQL Practices**: 100% adherence to parameterized SQL queries (`?`) in `src/lib/queries.ts`, neutralizing SQL injection vectors.
- **Clean Architecture**: Strong separation of concerns between data-access layer (`lib/queries.ts`), UI components (`components/`), and App Router pages (`app/`).
- **Zero Static Errors**: 0 ESLint errors and 0 TypeScript compilation errors. All 21 Vitest tests pass in ~1.29s.

---

## Findings

### 🔴 Critical
*No critical issues found.*

### 🟠 High Priority
*No high priority issues found.*

### 🟡 Medium Priority

#### [M-01] Synchronous DB Driver Blocking
- **File**: `nba-reference/src/lib/queries.ts`
- **Category**: Performance
- **Issue**: The application utilizes `better-sqlite3`, which executes queries synchronously on the main thread (using `.all()` and `.get()`).
- **Impact**: While `better-sqlite3` is extremely fast for standard queries, running large aggregations concurrently can block the Node.js event loop, stalling other requests and degrading overall throughput under heavy load.
- **Evidence**:
  ```typescript
  export function getPlayerSeasonStats(brefId: string, limit = 25) {
    return getDb().prepare(`...`).all(brefId, limit);
  }
  ```
- **Recommendation**: Since this is a Next.js environment, the fast synchronous queries are generally fine for a medium-traffic site. However, for a high-traffic production scenario, consider caching results aggressively (e.g., using Next.js `unstable_cache` or `fetch` tags) or offloading heavy DB reads to a worker thread if the DB scales up.
- **Effort**: Medium (1-4 hrs)

### 🟢 Low Priority / Improvements

#### [L-01] In-memory CSV string concatenation
- **File**: `nba-reference/src/components/stats-table.tsx:49`
- **Category**: Performance
- **Issue**: The CSV data is built entirely in memory via `Array.prototype.join()` and encoded directly into a `data:text/csv` URI.
- **Impact**: Large result sets can exceed URL length limits in some browsers or cause high client-side memory usage, potentially crashing the browser tab.
- **Evidence**:
  ```typescript
  const csvData = useMemo(() => {
    ...
    return [header, ...lines].join("\n");
  }, [columns, sorted]);
  ```
- **Recommendation**: For large datasets, use the native `Blob` API to generate an object URL (`URL.createObjectURL(blob)`) instead of a `data:` URI to avoid size constraints.
- **Effort**: Small (<30 min)

#### [L-02] Unstable Fallback React Keys
- **File**: `nba-reference/src/components/stats-table.tsx:102`
- **Category**: Quality
- **Issue**: The fallback `rowKey` is computed by concatenating all column values. If two rows have identical data, it will produce duplicate React keys.
- **Impact**: Duplicate keys can cause React rendering bugs, such as incorrect state associations or performance penalties during reconciliation.
- **Evidence**:
  ```typescript
  const rowKey =
    typeof primaryKey === "string" || typeof primaryKey === "number"
      ? `${primaryKey}`
      : columns.map((col) => `${row[col.key] ?? ""}`).join("|");
  ```
- **Recommendation**: Append a stable row index (`${index}`) to the fallback generation to guarantee uniqueness.
- **Effort**: Small (<30 min)

---

## Category Deep Dives

### 1. Architecture & Design
The project is built on Next.js App Router with an explicit SQLite database module. The architecture successfully isolates database concerns to `src/lib/db.ts` and `src/lib/queries.ts`. By centralizing data fetching, the rest of the application remains focused on presentation. The `skills` directory appears to hold operational/DevTools logic. 

### 2. Code Quality
Code quality is exceptionally high. Strict TypeScript is actively enforced and passes without warnings. The code employs clean data formatting helpers (`lib/formatters.ts`), avoids deep nesting, and lacks any marker of technical debt (no `TODO` or `FIXME` comments). Control flow is clean and predictable across all 50+ files.

### 3. Security
Security patterns are well integrated. The `better-sqlite3` instance operates strictly in `{ readonly: true }` mode, drastically limiting the attack surface. Furthermore, all SQL queries dynamically bind variables (e.g. `WHERE player_id = ?`), inherently avoiding SQL injection. The UI correctly utilizes React, and no unprotected `dangerouslySetInnerHTML` assignments exist within the core application. 

### 4. Performance
The use of WAL mode (`db.pragma("journal_mode = WAL")`) significantly optimizes SQLite performance for concurrent readers. The synchronous nature of `better-sqlite3` is the sole moderate bottleneck for high-concurrency environments ([M-01]). Client-side sorting in `StatsTable.tsx` handles large datasets gracefully through `useMemo`, although CSV generation could be further optimized with `Blob` objects ([L-01]).

### 5. Testing
The project includes a well-defined suite of Vitest test files corresponding directly to the core modules (`db.test.ts`, `queries.test.ts`, `stats-table.test.tsx`, `search-box.test.tsx`). The test suite demonstrates rapid execution (<2s total) and reliable coverage over both database queries and UI logic. 

### 6. Maintainability
The codebase is extremely lightweight (~4,000 LOC for the Next.js app) and self-documenting. Dependencies are kept to a minimum. There is no evidence of "import bloat" (e.g., no heavy `lodash` wildcard imports) or circular dependencies. The modular design of `src/lib/queries.ts` natively supports seamless extensions as the database schema evolves.

---

## Prioritized Action Plan

### Quick Wins (< 1 day each)
- [ ] **[L-01]** `nba-reference/src/components/stats-table.tsx:49` — Refactor CSV export to use `Blob` and `URL.createObjectURL` instead of a raw `data:` URI.
- [ ] **[L-02]** `nba-reference/src/components/stats-table.tsx:102` — Append the row `index` to the fallback `rowKey` string to ensure absolute uniqueness.

### Medium-term (1–5 days each)
- [ ] **[M-01]** Implement Next.js caching layers (`unstable_cache` / Request Memoization) on data-fetching methods in `queries.ts` to protect the Node.js event loop against heavily repetitive, concurrent DB calls.

### Strategic Initiatives (> 5 days)
- [ ] Investigate transitioning SQLite fetching to a separate worker thread or using an asynchronous SQLite driver wrapper if production load reveals event-loop lag.

---

## Metrics Dashboard

| Metric | Value |
|---|---|
| Files Analyzed | 54 (Source & Tests) |
| Total Lines of Code | ~4,121 |
| Languages Detected | TypeScript, JavaScript, HTML, CSS, JSON, Markdown |
| Test-to-Source File Ratio | 4 Test : 26 Source files |
| Complexity Hotspots (files) | 0 |
| Security Findings | 🔴 0  🟠 0  🟡 0  🟢 0 |
| TODO / FIXME / HACK Count | 0 / 0 / 0 |
| Avg File Length (LOC) | ~76 |
| Longest File | `src/lib/queries.ts` (920 lines) |