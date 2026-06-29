import { clsx, type ClassValue } from "clsx"
import { tailwind-merge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
