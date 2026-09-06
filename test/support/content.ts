import { readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

/**
 * Reads authored content straight from disk.
 *
 * Astro already validates each file against its Zod schema at build time, so
 * these helpers exist for the checks a schema cannot make: cross-references
 * between collections and configuration, and uniqueness across files.
 */

export const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export interface ContentFile<T> {
  /** The filename without extension — this becomes the URL slug. */
  slug: string;
  path: string;
  data: T;
  body: string;
}

function parse<T>(dir: string, file: string): ContentFile<T> {
  const path = join(dir, file);
  const raw = readFileSync(path, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);

  if (!match) {
    throw new Error(`${file} has no frontmatter block`);
  }

  return {
    slug: basename(file, extname(file)),
    path,
    data: yaml.load(match[1]!) as T,
    body: match[2] ?? '',
  };
}

function load<T>(relativeDir: string, extensions: string[]): ContentFile<T>[] {
  const dir = join(repoRoot, relativeDir);
  return readdirSync(dir)
    .filter((f) => extensions.includes(extname(f)))
    .map((f) => parse<T>(dir, f));
}

export interface PracticeAreaData {
  title: string;
  shortTitle: string;
  order: number;
  numeral: string;
  summary: string;
  statement: string;
  faqKey: string;
  seoTitle?: string;
  seoDescription?: string;
  services?: { title: string; description: string }[];
  situations?: string[];
  process?: { title: string; body: string }[];
}

export interface InsightData {
  title: string;
  description: string;
  category: string;
  publishDate: Date | string;
  updatedDate?: Date | string;
  relatedPracticeArea?: string;
  sample?: boolean;
  draft?: boolean;
}

export const practiceAreas = () => load<PracticeAreaData>('src/content/practice-areas', ['.md']);
export const insights = () => load<InsightData>('src/content/insights', ['.md', '.mdx']);
