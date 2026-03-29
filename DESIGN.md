
# Design System Document: The Digital Cathedral



## 1. Overview & Creative North Star

The Creative North Star for this system is **"The Scholarly Spectacle."**



We are moving away from the cold, sterile "SaaS dashboard" aesthetic common in sports analytics. Instead, we are building a digital cathedral where basketball statistics are treated with the reverence of Renaissance theology. This design system rejects the "flat" web by embracing intentional asymmetry, overlapping monumental elements, and a high-contrast editorial scale.



The goal is to make the user feel like they are flipping through a priceless, illuminated manuscript where every "point per game" metric is a piece of sacred history. We break the grid using "floating" data points and "marble block" containers that use depth rather than lines to define space.



---



## 2. Colors & Atmospheric Depth

Our palette is rooted in the pigments of the 16th century: the deep heavens of Lapis Lazuli, the earthy warmth of baked Terracotta, and the divinity of Gold Leaf.



### The Palette

* **Primary (Lapis Lazuli):** `#00245e` – Used for deep background "heavens" and high-authority type.

* **Secondary (Terracotta):** `#9f402d` – Used for action, passion, and human-centric elements.

* **Tertiary (Gold Leaf):** `#735c00` – Used for accents, filigree, and high-value data highlights.

* **Surface (Marble White):** `#fbf9f2` – The foundational stone of the interface.



### The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined through tonal shifts.

* Use `surface-container-low` (`#f6f4ec`) for background sections.

* Use `surface-container-highest` (`#e4e2dc`) for interactive "stone" blocks.

* Separation is achieved via the `surface-dim` (`#dcdad3`) value for soft transitions.



### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers:

1. **The Base (Cathedral Floor):** `surface` (`#fbf9f2`).

2. **The Pedestal (Content Areas):** `surface-container-low` (`#f6f4ec`).

3. **The Altar (Primary Cards):** `surface-container-highest` (`#e4e2dc`).



### The "Glass & Gradient" Rule

To mimic the translucency of fresco plaster, use **Glassmorphism** for floating data overlays. Apply a semi-transparent `surface_container_lowest` (white at 70% opacity) with a `backdrop-blur` of 12px. For primary CTAs, apply a subtle linear gradient from `primary` (`#00245e`) to `primary_container` (`#00388a`) to provide a "velvet" depth.



---



## 3. Typography: The Regal Script

Typography is our primary tool for conveying "Scholarly Authority."



* **Display & Headlines (The Inscription):** Uses `notoSerif` (a placeholder for a high-contrast regal serif).

* *Role:* These should be set with wide tracking (+5%) to mimic stone carvings.

* *Scale:* Use `display-lg` (3.5rem) for player names and `headline-md` (1.75rem) for category titles.

* **Body & Data (The Manuscript):** Uses `newsreader`.

* *Role:* A scholarly serif that remains legible at small sizes.

* *Scale:* Use `body-md` (0.875rem) for descriptions and `label-md` (0.75rem) for tabular data.

* *Intent:* Data shouldn't feel like a spreadsheet; it should feel like a footnote in a classic text.



---



## 4. Elevation & Depth

We eschew traditional shadows in favor of **Tonal Layering**.



* **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container-low` section. This creates a "soft lift" that feels like paper on stone.

* **Ambient Shadows:** If an element must float (e.g., a modal), use a shadow color tinted with `on-surface` (`#1b1c18` at 6% opacity) with a blur radius of at least `32px`. Never use pure black shadows.

* **The "Ghost Border" Fallback:** If a container requires definition against a complex background, use `outline-variant` (`#c4c5d5`) at **15% opacity**.

* **Interactive Glow:** On hover, instead of a shadow, use a `tertiary_container` (`#cca730`) outer glow (5px blur) to simulate the shimmering of gold leaf in candlelight.



---



## 5. Components



### Buttons (The Wax Seals & Carved Stone)

* **Primary:** Background of `secondary` (`#9f402d`). Roundedness `md` (0.375rem). Use a 1px "Ghost Border" of `tertiary_fixed` (`#ffe088`) to simulate gold filigree.

* **Secondary:** Background of `surface-container-highest`. Text in `primary`. These should feel like blocks of carved marble.

* **Hover State:** Apply a "fresco" texture overlay (a subtle 5% grain) and transition the background color to a slightly brighter `secondary_container`.



### Navigation (Illuminated Tabs)

* Tabs should not have underlines. Instead, use an "Illuminated Manuscript" style where the active state features a `tertiary` (`#735c00`) drop-cap or a small gold leaf dot above the text.



### Cards & Lists (The Gallery)

* **Strict Rule:** No divider lines. Use `spacing-6` (2rem) of vertical whitespace to separate list items.

* **Data Tables:** Use alternating background tones (`surface` vs `surface-container-low`) to define rows. The header row should be `primary` with `on-primary` (white) text.



### Stat Chips

* Use `full` roundedness (9999px).

* Background: `tertiary_fixed_dim` (`#e9c349`).

* Text: `on-tertiary-fixed` (`#241a00`). These should look like small gold coins scattered across the page.



### Additional Component: The "Fresco" Hero

* A hero container that uses a background image with a `multiply` blend mode against the `primary` color, creating a dark, moody atmospheric start to the page.



---



## 6. Do's and Don'ts



### Do:

* **Use Intentional Asymmetry:** Offset text blocks by `spacing-4` to break the "web-template" feel.

* **Embrace Whitespace:** Use `spacing-12` (4rem) and `spacing-16` (5.5rem) to let data "breathe" like a gallery wall.

* **Mix Weights:** Pair a `display-lg` serif title with a `label-sm` sans-serif (if necessary) for a modern-editorial look.



### Don't:

* **No "Pure" Greys:** All neutrals must be warmed with the `surface` tint to maintain the "marble" feel.

* **No Hard Borders:** Avoid 100% opaque outlines. They break the illusion of an organic, hand-crafted manuscript.

* **No Standard Shadows:** Avoid "drop-shadow: 0 4px 4px #000." It looks cheap. Use large, soft, tinted blurs.

* **No Crowding:** Basketball stats are dense. If you crowd them, the "Cathedral" becomes a "Basement." Increase padding by 1.5x what you think is necessary.



---



*Director's Final Note: Every pixel should feel like it was placed by a master craftsman. If an element looks like it came from a standard UI kit, delete it and start over with the "Marble and Gold" mindset.*```
