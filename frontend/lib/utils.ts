import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSafeDate(dateVal: any, formatStr: string = "MMM d, yyyy"): string {
  if (!dateVal) return "";
  try {
    let d: Date;
    if (typeof dateVal === "string" || typeof dateVal === "number") {
      d = new Date(dateVal);
    } else if (dateVal && typeof dateVal === "object" && "year" in dateVal) {
      const year = typeof dateVal.year === "object" ? dateVal.year.low : Number(dateVal.year);
      const month = (typeof dateVal.month === "object" ? dateVal.month.low : Number(dateVal.month || 1)) - 1;
      const day = typeof dateVal.day === "object" ? dateVal.day.low : Number(dateVal.day || 1);
      d = new Date(year, month, day);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return "";
    return format(d, formatStr);
  } catch {
    return "";
  }
}

