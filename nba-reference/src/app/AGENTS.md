# APP ROUTER KNOWLEDGE BASE

## OVERVIEW
`src/app/` is the Next.js App Router surface: page routes, dynamic segments, and API route handlers.

## STRUCTURE
```text
app/
|- layout.tsx
|- page.tsx
|- api/
|  |- search/route.ts
|  |- export/[type]/route.ts
|- players/[id]/page.tsx
|- teams/[abbrev]/page.tsx
|- games/[id]/page.tsx
|- seasons/[year]/page.tsx
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Global shell/meta | `layout.tsx` | Fonts, global classes, header wiring |
| Home composition | `page.tsx` | Dashboard cards and table preview |
| API search behavior | `api/search/route.ts` | Query minimum length, JSON payload |
| Export behavior | `api/export/[type]/route.ts` | CSV generation and type switch |

## CONVENTIONS
- Route files use `page.tsx`; API handlers use `route.ts`.
- Dynamic params are Promise-based in several pages; match local pattern.
- Most pages are server components and call query functions directly.

## ANTI-PATTERNS (APP)
- Do not put DB SQL directly in route/page files; call `@/lib/*` query helpers.
- Do not import UI components into `src/lib/` (keep dependency direction one-way).
- Do not return large unbounded API exports without explicit limits.

## NOTES
- Visual parity references live in `reference_screenshots/` at package root.
