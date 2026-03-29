# Implementation Plan

[Overview]
Align the `nba-reference` Next.js application with the "Digital Cathedral" design system in `DESIGN.md` by replacing the current paper-and-border visual language with a marble-and-gold editorial system built on tonal layering, serif typography, intentional asymmetry, and design-token-driven shared primitives.

The current application already has a centralized styling foundation in `nba-reference/src/app/globals.css`, reusable UI primitives in `nba-reference/src/components/ui/`, and shared table helpers in `nba-reference/src/lib/table-styles.ts`. That makes the design-system migration feasible without changing the data layer or route architecture. The main gap is that the live UI still relies heavily on hard borders, traditional shadows, generic sans/mono typography, white table rows, and a conventional utility mix that conflicts with the `DESIGN.md` rules around tonal separation, no-line sectioning, glass overlays, gold-accent interactions, and high-contrast serif presentation.

This implementation should be executed as a structured visual refactor rather than a one-off page restyle. The first layer is a token and typography overhaul: replace the current CSS variable set with the Lapis/Terracotta/Gold/Marble palette, define surface hierarchy tokens, introduce the new display/body fonts, and add reusable utility classes for stone panels, glass overlays, ghost borders, illuminated navigation, and fresco hero treatment. The second layer is component normalization: update buttons, cards, inputs, navigation, filters, chips, dropdowns, and tables so all high-traffic surfaces inherit the new rules automatically. The third layer is page composition: adapt the homepage and shared page-level sections to use the new editorial spacing, asymmetry, hero treatment, and layered containers. Finally, run an app-wide cleanup pass over routes and shared components that still contain banned patterns such as opaque borders, divider lines, pure black shadows, and bright white surfaces.

Because the app spans many routes, the plan should treat the work as a full-system alignment performed in phases, with the shared foundation and highest-visibility surfaces implemented first. That sequencing minimizes churn, keeps visual logic centralized, and allows the remaining route pages to inherit the new system with smaller targeted updates rather than bespoke redesigns.

[Types]
The type-system work is limited to UI variant and token-driven component APIs rather than data-model changes.

Detailed type and interface updates:

- `nba-reference/src/components/ui/button.tsx`
  - Modify `ButtonVariant` from:
    - `'default' | 'accent' | 'muted' | 'danger' | 'pill' | 'cta' | 'soft'`
  - To a design-system-driven set such as:
    - `'primary' | 'secondary' | 'ghost' | 'chip' | 'heroCta' | 'danger'`
  - Validation rules:
    - `primary` maps to terracotta wax-seal styling with gold ghost border.
    - `secondary` maps to carved-marble block styling.
    - `ghost` is for low-emphasis contextual actions without hard borders.
    - `chip` is for full-pill stat/favorite treatments.
    - `heroCta` is reserved for high-emphasis calls to action and uses the velvet blue gradient.
    - `danger` remains functional but should be visually harmonized to the palette instead of generic blue/red utility tones.

- `nba-reference/src/components/ui/card.tsx`
  - Modify `CardVariant` from:
    - `'paper' | 'soft' | 'white'`
  - To a hierarchical token set such as:
    - `'altar' | 'pedestal' | 'glass' | 'inset'`
  - Validation rules:
    - `altar` uses `surface-container-highest` tonal treatment for primary cards.
    - `pedestal` uses `surface-container-low` for broader content areas.
    - `glass` uses semi-transparent light surface plus `backdrop-blur` for overlays/dropdowns.
    - `inset` is a subtle nested surface for embedded subsections.

- `nba-reference/src/lib/table-styles.ts`
  - Add a local alignment type alias if needed for clarity:
    - `type TableAlign = 'left' | 'right';`
  - Keep function signatures stable unless a helper object form materially improves reuse.
  - Validation rules:
    - Table helpers must never emit full-opacity border utilities as the primary separation mechanism.
    - Row/header helpers must encode alternating tonal fills and generous spacing.

- `nba-reference/src/components/site-header.tsx` and `nba-reference/src/components/mobile-nav.tsx`
  - No new runtime data types are required, but if nav item styling becomes shared, introduce:
    - `interface NavItemConfig { href: Route; label: string; accent?: 'dot' | 'dropcap' | 'none' }`
  - Validation rules:
    - Active or emphasized nav items must support the illuminated-tab metaphor without underlines.

- `nba-reference/src/app/globals.css`
  - No TypeScript types, but the token contract should be treated as a stable system interface.
  - Required token groups:
    - Core palette: `--color-primary`, `--color-secondary`, `--color-tertiary`, `--color-surface`
    - Surface hierarchy: `--color-surface-container-low`, `--color-surface-container-highest`, `--color-surface-dim`, `--color-surface-container-lowest`
    - Text roles: `--color-on-surface`, `--color-on-primary`, `--color-on-secondary`, `--color-on-tertiary-fixed`
    - Interaction roles: `--color-primary-container`, `--color-secondary-container`, `--color-tertiary-container`, `--color-outline-variant`
    - Effects: ambient shadow, glow, ghost-border alpha values, backdrop blur strength, grain overlay opacity
    - Typography: `--font-display`, `--font-body`, `--tracking-inscription`, display/headline/body/label scale tokens
  - Validation rules:
    - Neutral tokens must remain warm; no pure grey aliases.
    - Border-like tokens are fallback-only and must be low opacity.
    - Table/header/list separation must be possible using fill tokens alone.

- `nba-reference/src/components/search-box.tsx`, `nba-reference/src/components/favorites/favorites-widget.tsx`, and filter/navigation components
  - Preserve current props unless a shared `variant` prop is needed for styling consistency.
  - Any new optional props must be additive and default-safe so existing call sites remain valid.

[Files]
The implementation centers on a global token overhaul plus focused modifications to shared UI primitives, navigation, search, table styling, and the homepage shell.

Detailed breakdown:

- New files to be created
  - `implementation_task.md`
    - Purpose: self-contained handoff brief for the implementation agent because the requested `new_task` tool is not available in this environment.

- Existing files to be modified
  - `implementation_plan.md`
    - This plan document.
  - `nba-reference/src/app/globals.css`
    - Replace current custom property palette and shadow rules with `DESIGN.md` token system.
    - Add typography tokens and utility classes for marble surfaces, altar cards, glass overlays, ghost borders, illuminated nav accents, fresco hero, gold-coin chips, and large editorial spacing.
    - Remove or deprecate current line-heavy utilities such as `panel-paper` if they encode banned hard-border behavior.
  - `nba-reference/src/app/layout.tsx`
    - Swap current Geist-based font setup for design-aligned serif fonts via `next/font/google`.
    - Update body-level class names and skip-link styling to consume new tokens.
    - Ensure the root shell supports the new background treatment and typography roles.
  - `nba-reference/src/components/ui/button.tsx`
    - Redefine variants and class mappings to match wax-seal, carved-marble, hero CTA, and chip treatments.
  - `nba-reference/src/components/ui/card.tsx`
    - Replace current border-forward variants with surface-layered variants.
  - `nba-reference/src/components/ui/input.tsx`
    - Restyle inputs to use marble/glass surfaces, softened outlines, tinted focus glow, and warm placeholder text.
  - `nba-reference/src/components/ui/skeleton.tsx`
    - Update skeleton tones so loading states fit the new surface system.
  - `nba-reference/src/components/site-header.tsx`
    - Redesign the header as an editorial/heroic navigation band using primary tones, serif branding, illuminated active/emphasis affordances, and no hard divider line.
  - `nba-reference/src/components/mobile-nav.tsx`
    - Replace strong black overlay and bordered slideout with tinted atmospheric overlay and stone-panel drawer styling.
  - `nba-reference/src/components/theme/theme-toggle.tsx`
    - Align toggle with carved-stone icon button styling and glow-on-hover behavior.
  - `nba-reference/src/components/search-box.tsx`
    - Convert dropdown to glassmorphism + tonal separation.
    - Remove hard row dividers and underline-heavy interactions.
  - `nba-reference/src/components/favorites/favorites-widget.tsx`
    - Restyle section as gallery/altar block and favorite links as gold-coin chips.
  - `nba-reference/src/components/filters/filter-bar.tsx`
    - Remove vertical line divider and use spacing + tonal grouping instead.
  - `nba-reference/src/components/filters/season-range-filter.tsx`
    - Update select/input styling to shared design tokens.
  - `nba-reference/src/components/filters/stat-filter.tsx`
    - Update label and input composition to match manuscript controls.
  - `nba-reference/src/components/home-explore-links.tsx`
    - Restyle link group into editorial cards/chips consistent with the gallery rules.
  - `nba-reference/src/components/related-links-panel.tsx`
    - Replace border-first cards with tonal marble blocks.
  - `nba-reference/src/components/pagination-nav.tsx`
    - Remove top divider line and convert pagination items to carved-stone / illuminated active-state treatment.
  - `nba-reference/src/components/season-awards-summary.tsx`
    - Remove borders and use layered surfaces plus gold-accent labels.
  - `nba-reference/src/components/season-standings-section.tsx`
    - Apply editorial section spacing, headings, and layered tables/cards.
  - `nba-reference/src/components/stats-table.tsx`
    - Ensure export area, outer container, and table wrapper align with new gallery/table system.
  - `nba-reference/src/lib/table-styles.ts`
    - Rewrite shared table classes to eliminate hard-border dependence and enforce alternating tonal fills, primary-color header row, and whitespace separation.
  - `nba-reference/src/app/page.tsx`
    - Introduce a fresco-style hero/header composition.
    - Rework section shells and CTA group to use new variants and spacing.
  - `nba-reference/src/app/not-found.tsx`
    - Update typography and action styling to the new system.
  - `nba-reference/src/app/error.tsx`
    - Update typography and action styling to the new system.
  - Representative route files containing explicit old visual patterns should be updated after shared primitives land, including:
    - `nba-reference/src/app/games/page.tsx`
    - `nba-reference/src/app/games/[id]/page.tsx`
    - `nba-reference/src/app/leaders/page.tsx`
    - `nba-reference/src/app/seasons/[year]/page.tsx`
    - `nba-reference/src/app/teams/page.tsx`
    - `nba-reference/src/app/leagues/page.tsx`
    - `nba-reference/src/app/leagues/salary-cap/page.tsx`
    - `nba-reference/src/app/teams/[abbrev]/franchise/page.tsx`
    - These contain direct `border-*`, `bg-white`, `hover:underline`, or old token usage that will not be fully corrected by shared primitives alone.

- Files to be deleted or moved
  - No files should be deleted initially.
  - Existing utility names that become misleading should be deprecated in place first, then renamed only if all call sites can be updated in the same implementation pass.

- Configuration file updates
  - `nba-reference/src/app/layout.tsx` font imports act as the effective configuration point for typography.
  - `nba-reference/package.json`
    - No dependency additions are expected if fonts come from `next/font/google`.
    - No script changes required unless a visual regression workflow is introduced later.

[Functions]
The functional changes are mostly styling-API and helper updates, with runtime behavior preserved wherever possible.

Detailed breakdown:

- New functions
  - `nba-reference/src/lib/table-styles.ts`
    - Optional: `tableSectionClass(variant?: 'default' | 'dense' | 'hero'): string`
    - Purpose: centralize outer shell styling for shared table sections if repeated across pages.
  - `nba-reference/src/lib/table-styles.ts`
    - Optional: `tableRowClass(isHighlighted?: boolean): string`
    - Purpose: support elevated or highlighted rows without hand-written page-level utilities.
  - `nba-reference/src/components/site-header.tsx` or a colocated helper module
    - Optional: `getNavLinkClass(options?: { emphasized?: boolean }): string`
    - Purpose: unify illuminated navigation styling across desktop and mobile.

- Modified functions
  - `buttonStyles` — `nba-reference/src/components/ui/button.tsx`
    - Required changes:
      - Remap variant semantics to the new design system.
      - Remove hard-border-first defaults and generic accent/blue danger styling.
      - Introduce ghost-border, glow, and gradient logic where appropriate.
  - `Button` — `nba-reference/src/components/ui/button.tsx`
    - Required changes:
      - Continue forwarding props unchanged.
      - Consume updated variants and preserve accessibility/disabled behavior.
  - `Card` — `nba-reference/src/components/ui/card.tsx`
    - Required changes:
      - Consume new surface-layer variants and remove line-heavy default styling.
  - `Input` — `nba-reference/src/components/ui/input.tsx`
    - Required changes:
      - Update class composition for glass/marble input treatment and softened focus styles.
  - `SiteHeader` — `nba-reference/src/components/site-header.tsx`
    - Required changes:
      - Update shell structure/classes to support illuminated tabs, editorial logo treatment, and new spacing/hover behavior.
  - `MobileNav` — `nba-reference/src/components/mobile-nav.tsx`
    - Required changes:
      - Replace black overlay/bordered drawer styling with atmospheric overlay and pedestal/altar surfaces.
      - Rework link affordances to avoid simple hover color-only behavior.
  - `ThemeToggle` — `nba-reference/src/components/theme/theme-toggle.tsx`
    - Required changes:
      - Update placeholder and mounted states to the new icon-button appearance.
  - `SearchBox` — `nba-reference/src/components/search-box.tsx`
    - Required changes:
      - Keep debounce and keyboard behavior intact.
      - Replace dropdown container/item classes to comply with glass and no-divider rules.
  - `StatsTable` — `nba-reference/src/components/stats-table.tsx`
    - Required changes:
      - Preserve sorting/export functionality.
      - Update export button placement/container styling and table outer framing.
  - `tableHeaderCellClass` — `nba-reference/src/lib/table-styles.ts`
    - Required changes:
      - Replace `border border-line` output with tonal/spacing-based header treatment.
  - `tableCellClass` — `nba-reference/src/lib/table-styles.ts`
    - Required changes:
      - Remove `border border-line-soft` output and shift to padding/row background separation.
  - `Home` — `nba-reference/src/app/page.tsx`
    - Required changes:
      - Recompose landing page into a fresco hero + gallery section structure.
      - Update section wrappers, CTA variants, and typography hierarchy.

- Removed functions
  - None required.
  - Migration strategy: preserve existing function names unless a helper becomes actively misleading; this limits downstream churn.

[Classes]
There are no class-based React or TypeScript models to add or refactor; the relevant "class" work is CSS utility/class-name composition.

Detailed breakdown:

- New classes
  - No new TypeScript/ES classes are required.
  - New CSS utility classes should be defined in `nba-reference/src/app/globals.css`, for example:
    - `.surface-pedestal`
    - `.surface-altar`
    - `.surface-glass`
    - `.ghost-border`
    - `.fresco-hero`
    - `.illuminated-tab`
    - `.stat-coin`
    - `.editorial-kicker`
    - `.inscription-title`
    - `.ambient-glow-hover`
  - These are not mandatory exact names, but the final set should centralize recurring patterns instead of scattering large Tailwind strings across route files.

- Modified classes
  - Existing utility alias `.panel-paper` in `nba-reference/src/app/globals.css`
    - Specific modifications:
      - Either redefine it to use the new stone-layer treatment or replace usages with clearer new utility names.
  - Existing Tailwind class compositions embedded in shared components
    - Specific modifications:
      - Replace direct `border-*`, `bg-white`, `shadow-*`, and `hover:underline` patterns where they violate `DESIGN.md`.

- Removed classes
  - Remove dependency on old semantic token aliases that encode hard-line behavior, especially any utilities whose main identity is bordered paper cards.
  - Replacement strategy:
    - Replace line-based semantics with surface hierarchy and ghost-border fallback classes.

[Dependencies]
No new npm packages are strictly required; the work should primarily reuse Next.js, Tailwind CSS 4, and `next/font/google`.

Details:

- New packages
  - None expected.

- Version changes
  - None expected.

- Integration requirements
  - Use `next/font/google` in `nba-reference/src/app/layout.tsx` to load design-aligned fonts such as `Noto_Serif` for display/headlines and `Newsreader` for body/manuscript text.
  - Confirm selected fonts support the required weights and italic behavior used across headings/body copy.
  - Keep Tailwind v4 token exposure in `globals.css` via `@theme inline` so new CSS variables remain accessible through utility classes.

[Testing]
Testing should focus on safeguarding shared style helpers, component variant contracts, and regression-prone interactive surfaces while supplementing manual visual review across the highest-traffic routes.

Test requirements and validation strategy:

- Existing test files to modify
  - `nba-reference/src/lib/table-styles.test.ts`
    - Update expectations to match the new table helper output.
    - Remove assertions that depend on `border-line`, `odd:bg-white`, or other deprecated classes.
  - `nba-reference/src/app/page.test.tsx`
    - Update any snapshot/string expectations impacted by homepage structure or heading text wrappers.
  - Any component tests that assert exact class strings for button/input/card variants should be updated if present.

- New or expanded tests to add
  - `nba-reference/src/components/ui/button` tests if variant mapping lacks direct coverage.
    - Validate each supported variant emits the intended semantic class group.
  - `nba-reference/src/components/search-box.test.tsx`
    - Preserve behavioral assertions while relaxing brittle class-name expectations.
  - `nba-reference/src/components/stats-table.test.tsx`
    - Ensure sorting/export behavior still works after visual refactor.

- Manual validation checklist
  - Homepage hero, search, favorites, and standings sections render with the new design system in both light and dark modes.
  - Header and mobile nav avoid hard divider lines and feel visually consistent.
  - Tables use alternating tonal fills and primary-colored header rows, not hard gridlines.
  - Buttons, chips, and form controls use the updated palette and hover/glow behavior.
  - No major route still shows `bg-white`, default blue danger buttons, or obvious black drop shadows where shared primitives should have replaced them.

- Command validation
  - Run from `nba-reference/`:
    - `npm run test`
    - `npm run lint`
    - `npm run type-check`

[Implementation Order]
Implement the design-system migration from the foundation outward so that global tokens and shared primitives stabilize first, then progressively restyle page compositions and route-specific leftovers.

1. Audit `DESIGN.md` requirements against current token/primitives usage and lock the migration scope around shared foundation plus high-visibility surfaces first.
2. Update `nba-reference/src/app/layout.tsx` font configuration and rebuild `nba-reference/src/app/globals.css` around the new palette, typography, surface hierarchy, glow, and utility classes.
3. Refactor shared UI primitives in `nba-reference/src/components/ui/` (`button.tsx`, `card.tsx`, `input.tsx`, `skeleton.tsx`) so downstream consumers inherit the new look automatically.
4. Refactor shared chrome and navigation (`site-header.tsx`, `mobile-nav.tsx`, `theme-toggle.tsx`) to establish the illuminated-cathedral shell.
5. Refactor shared interaction surfaces (`search-box.tsx`, favorites, filters, related links, pagination, awards summary, standings section) to remove hard dividers and adopt layered surfaces/chips/glass treatments.
6. Rewrite `nba-reference/src/lib/table-styles.ts` and then adjust `stats-table.tsx` so all data tables follow the new no-line gallery rules with primary header rows and tonal striping.
7. Recompose the homepage in `nba-reference/src/app/page.tsx` into a fresco hero plus layered content sections using the updated primitives.
8. Sweep representative route pages that still contain explicit banned styling patterns and replace remaining direct classes with design-system-compliant utilities.
9. Update and add tests for shared styling helpers and interactive components, then run lint/type-check/test.
10. Perform manual visual QA in light and dark themes across homepage, tables, navigation, search, and representative detail/index pages before merging.