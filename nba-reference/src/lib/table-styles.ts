import { cn } from "@/lib/utils";

export const tableContainerClass = "overflow-x-auto";
export const tableClass = "min-w-full border-collapse text-xs text-ink";
export const tableHeadRowClass = "bg-thead";
export const tableBodyRowClass = "transition-colors duration-200 odd:bg-white even:bg-row-alt hover:bg-row-hover";
export const tableHeaderButtonClass = "w-full cursor-pointer transition-colors duration-150 hover:text-muted";
export const tableLinkClass = "text-link underline decoration-transparent transition-all duration-200 hover:decoration-current";

export function tableHeaderCellClass(align?: "left" | "right") {
  return cn("border border-line px-2 py-1", align === "right" ? "text-right" : "text-left");
}

export function tableCellClass(align?: "left" | "right") {
  return cn(
    "border border-line-soft px-2 py-1",
    align === "right" ? "text-right tabular-nums" : "text-left",
  );
}
