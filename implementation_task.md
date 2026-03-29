# Implementation Task Handoff

Refer to @implementation_plan.md for a complete breakdown of the task requirements and steps. You should periodically read this file again.

Implement the `DESIGN.md` alignment plan for the `nba-reference` app using the plan document as the source of truth. Do not repeat codebase discovery unless you find a direct contradiction with the plan. Prioritize shared foundations and highest-visibility surfaces first, then complete the representative route sweep described in the plan.

Plan Document Navigation Commands:

```bash
# Read Overview section
sed -n '/\[Overview\]/,/\[Types\]/p' implementation_plan.md | cat

# Read Types section
sed -n '/\[Types\]/,/\[Files\]/p' implementation_plan.md | cat

# Read Files section
sed -n '/\[Files\]/,/\[Functions\]/p' implementation_plan.md | cat

# Read Functions section
sed -n '/\[Functions\]/,/\[Classes\]/p' implementation_plan.md | cat

# Read Classes section
sed -n '/\[Classes\]/,/\[Dependencies\]/p' implementation_plan.md | cat

# Read Dependencies section
sed -n '/\[Dependencies\]/,/\[Testing\]/p' implementation_plan.md | cat

# Read Testing section
sed -n '/\[Testing\]/,/\[Implementation Order\]/p' implementation_plan.md | cat

# Read Implementation Order section
sed -n '/\[Implementation Order\]/,$p' implementation_plan.md | cat
```

Implementation expectations:

1. Start by updating the global token system and font configuration.
2. Refactor shared UI primitives before editing individual route files.
3. Preserve existing behavior for sorting, search, navigation, export, and theme switching.
4. Replace hard borders, default white blocks, and strong black shadows with tonal layering, ghost borders, and warm surfaces.
5. Run lint, tests, and type-check before finishing.

task_progress Items:
- [ ] Step 1: Rebuild the global token, typography, and utility foundation in `nba-reference/src/app/globals.css` and `nba-reference/src/app/layout.tsx`
- [ ] Step 2: Refactor shared UI primitives (`button`, `card`, `input`, `skeleton`) to match the Digital Cathedral design system
- [ ] Step 3: Refactor shared shell and interaction components (header, mobile nav, theme toggle, search, filters, favorites, pagination, related panels)
- [ ] Step 4: Rewrite shared table styling helpers and update table consumers to remove hard-line visual patterns
- [ ] Step 5: Recompose the homepage and representative high-traffic route pages to use the new editorial layout and surface hierarchy
- [ ] Step 6: Update automated tests, run validation commands, and perform manual visual QA on the major routes

Mode requirement:

- Work in act mode for implementation and verification.
