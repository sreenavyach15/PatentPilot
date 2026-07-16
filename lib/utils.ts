import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGooglePatentUrl(patentNumber: string) {
  const normalized = patentNumber.replace(/-/g, "");
  return `https://patents.google.com/patent/${normalized}`;
}