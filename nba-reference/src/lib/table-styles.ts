/**
 * @fileoverview Tailwind CSS utility classes for consistent table styling.
 * 
 * Provides reusable style constants for:
 * - Table containers with horizontal scrolling
 * - Header and body row styling
 * - Cell alignment (left/right) with proper padding
 * - Interactive elements (sortable headers, links)
 * 
 * All classes follow the design system defined in globals.css using
 * custom CSS variables for theming.
 * 
 * @module @/lib/table-styles
 */

import { cn } from "@/lib/utils";

/**
 * Container class enabling horizontal scroll for overflow tables.
 * Applied to the wrapper div around tables.
 */
export const tableContainerClass = "overflow-x-auto";

/**
 * Base table styles for full-width, collapsed borders with small text.
 * 
 * - `min-w-full`: Ensures table fills container width
 * - `border-collapse`: Removes gaps between cell borders
 * - `text-xs`: Small text size for dense data display
 * - `text-ink`: Primary text color from design system
 */
export const tableClass = "min-w-full border-collapse text-xs text-ink";

/**
 * Header row background color using theme's thead color.
 */
export const tableHeadRowClass = "bg-thead";

/**
 * Body row styles with alternating colors and hover effect.
 * 
 * - `odd:bg-white`: White background for odd rows
 * - `even:bg-row-alt`: Alternate background for even rows
 * - `hover:bg-row-hover`: Highlight on mouse hover
 * - `transition-colors duration-200`: Smooth color transitions
 */
export const tableBodyRowClass =
  "transition-colors duration-200 odd:bg-white even:bg-row-alt hover:bg-row-hover";

/**
 * Styles for clickable header buttons used for sorting.
 * 
 * - Full width for easy clicking
 * - Hover color change to indicate interactivity
 * - Pointer cursor
 */
export const tableHeaderButtonClass =
  "w-full cursor-pointer transition-colors duration-150 hover:text-muted";

/**
 * Link styles within table cells.
 * 
 * Uses underline decoration that appears on hover for subtle
 * indication of clickable content.
 */
export const tableLinkClass =
  "text-link underline decoration-transparent transition-all duration-200 hover:decoration-current";

/**
 * Generates header cell classes with optional right alignment.
 * 
 * @param align - Text alignment direction ("left" or "right")
 * @returns Combined class string with border, padding, and alignment
 * @example
 * ```tsx
 * <th className={tableHeaderCellClass("right")}>PTS</th>
 * ```
 */
export function tableHeaderCellClass(align?: "left" | "right") {
  return cn(
    "border border-line px-2 py-1",
    align === "right" ? "text-right" : "text-left",
  );
}

/**
 * Generates body cell classes with optional right alignment.
 * 
 * Right-aligned cells use `tabular-nums` for consistent number alignment.
 * Uses softer border color for visual hierarchy.
 * 
 * @param align - Text alignment direction ("left" or "right")
 * @returns Combined class string with border, padding, and alignment
 * @example
 * ```tsx
 * <td className={tableCellClass("right")}>{player.pts}</td>
 * ```
 */
export function tableCellClass(align?: "left" | "right") {
  return cn(
    "border border-line-soft px-2 py-1",
    align === "right" ? "text-right tabular-nums" : "text-left",
  );
}
