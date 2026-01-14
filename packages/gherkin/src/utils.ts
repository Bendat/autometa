/**
 * Utility functions for Gherkin processing
 */

import { randomBytes } from 'crypto';

export const version = "0.7.2";

export function generateId(obj?: { name?: string } | { text?: string }): string {
  const input = obj && 'name' in obj ? obj.name : 
                obj && 'text' in obj ? obj.text : 
                '';
  
  const hash = randomBytes(8).toString('hex');
  const sanitized = input ? input.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'unnamed';
  return `${sanitized}-${hash}`;
}

export function _combineAncestorTags(ancestorTags: string[], currentTags: string[]): string[] {
  const combinedTags = [...ancestorTags];
  for (const tag of currentTags) {
    if (!combinedTags.includes(tag)) {
      combinedTags.push(tag);
    }
  }
  return combinedTags;
}
