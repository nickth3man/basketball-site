/**
 * @fileoverview General utility functions used throughout the application.
 *
 * Currently provides Tailwind CSS class name merging via clsx and tailwind-merge.
 *
 * @module @/lib/utils
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class name values into a single merged Tailwind CSS class string.
 *
 * This utility uses:
 * - `clsx` for conditional class joining (handles arrays, objects, strings)
 * - `tailwind-merge` for deduplicating conflicting Tailwind classes
 *
 * @param inputs - Class values to combine (strings, arrays, objects, or undefined)
 * @returns Merged class string with conflicts resolved
 * @example
 * ```tsx
 * // Basic usage
 * <div className={cn("px-4", "py-2")} />
 *
 * // Conditional classes
 * <div className={cn("btn", isActive && "btn-active", isDisabled && "opacity-50")} />
 *
 * // Arrays and objects
 * <div className={cn(["px-4", "py-2"], { "bg-blue-500": isPrimary })} />
 *
 * // Conflict resolution (later values win)
 * <div className={cn("px-4", "px-8")} /> // Results in "px-8"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
