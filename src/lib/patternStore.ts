import { writable } from 'svelte/store';
import { exists, readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

export interface SavedPattern {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  notes?: string;
}

const DEFAULT_PATTERNS: SavedPattern[] = [
  { id: '1', name: 'Email', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'g', notes: 'Standard email validation' },
  { id: '2', name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'g', notes: 'Matches http/https URLs' },
  { id: '3', name: 'IPv4', pattern: '^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$', flags: 'g', notes: 'Validates IPv4 addresses' },
  { id: '4', name: 'Date (ISO)', pattern: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-][0-1]\\d:[0-5]\\d)$', flags: 'g', notes: 'ISO 8601 Date format' },
  { id: '5', name: 'Phone', pattern: '^\\+?[\\d\\s-]{10,20}$', flags: 'g', notes: 'Simple phone number check' },
  { id: '6', name: 'Hex Color', pattern: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', flags: 'g', notes: 'CSS Hex colors' },
  { id: '7', name: 'Slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', flags: 'g', notes: 'URL-friendly slugs' },
  { id: '8', name: 'JWT', pattern: '^([a-zA-Z0-9_=]+)\\.([a-zA-Z0-9_=]+)\\.([a-zA-Z0-9_\\-\\+\\/=]*)$', flags: 'g', notes: 'JSON Web Token structure' },
  { id: '9', name: 'Credit Card', pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})$', flags: 'g', notes: 'Basic credit card validation' },
  { id: '10', name: 'HTML Tag', pattern: '<([a-z1-6]+)([^>]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', flags: 'g', notes: 'Matches basic HTML tags' }
];

const FILE_NAME = 'patterns.json';

export const patterns = writable<SavedPattern[]>([]);

export async function loadPatterns() {
  try {
    const fileExists = await exists(FILE_NAME, { baseDir: BaseDirectory.AppLocalData });
    if (fileExists) {
      const content = await readTextFile(FILE_NAME, { baseDir: BaseDirectory.AppLocalData });
      patterns.set(JSON.parse(content));
    } else {
      patterns.set(DEFAULT_PATTERNS);
      await savePatterns(DEFAULT_PATTERNS);
    }
  } catch (e) {
    console.error('Failed to load patterns', e);
    patterns.set(DEFAULT_PATTERNS);
  }
}

export async function savePatterns(newPatterns: SavedPattern[]) {
  try {
    await writeTextFile(FILE_NAME, JSON.stringify(newPatterns, null, 2), { baseDir: BaseDirectory.AppLocalData });
    patterns.set(newPatterns);
  } catch (e) {
    console.error('Failed to save patterns', e);
  }
}

export async function addPattern(pattern: Omit<SavedPattern, 'id'>) {
  const newPattern = { ...pattern, id: crypto.randomUUID() };
  patterns.update(items => {
    const updated = [...items, newPattern];
    savePatterns(updated);
    return updated;
  });
}

export async function deletePattern(id: string) {
  patterns.update(items => {
    const updated = items.filter(p => p.id !== id);
    savePatterns(updated);
    return updated;
  });
}
