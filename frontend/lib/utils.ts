import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ||
    "https://sensei-2keb.onrender.com"
}
