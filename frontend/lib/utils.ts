import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn() = combine Tailwind classes intelligently
// Merges class names and resolves Tailwind conflicts
// e.g. cn('px-2', 'px-4') → 'px-4' (later wins)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str
}
