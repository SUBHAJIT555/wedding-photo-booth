/**
 * Tailwind Merger
 * @see https://github.com/dcastil/tailwind-merge
 *
 * This is a simple utility function that merges Tailwind CSS classes with the clsx utility.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => {
  return twMerge(clsx(inputs));
}