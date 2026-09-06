import { describe, expect, it } from 'vitest';
import { formatDate, isoDate, readingTime } from '../../src/lib/format';

describe('readingTime()', () => {
  it('never returns less than a minute', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('Three short words')).toBe(1);
  });

  it('scales with length', () => {
    const short = readingTime('word '.repeat(220));
    const long = readingTime('word '.repeat(1100));
    expect(short).toBe(1);
    expect(long).toBe(5);
  });

  it('ignores markdown syntax when counting', () => {
    const plain = 'word '.repeat(400);
    const marked = `## Heading\n\n${'**word** '.repeat(400)}\n\n- [link](https://example.com)`;
    expect(Math.abs(readingTime(marked) - readingTime(plain))).toBeLessThanOrEqual(1);
  });

  it('ignores fenced code blocks', () => {
    const withCode = `Intro text.\n\n\`\`\`\n${'noise '.repeat(2000)}\n\`\`\`\n\nOutro.`;
    expect(readingTime(withCode)).toBe(1);
  });
});

describe('formatDate()', () => {
  it('renders an unambiguous, non-numeric-month date', () => {
    expect(formatDate(new Date('2026-03-14T00:00:00Z'))).toBe('14 March 2026');
  });

  it('is stable regardless of the runner timezone', () => {
    // A UTC midnight date must not slip to the previous day west of Greenwich.
    expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('1 January 2026');
  });
});

describe('isoDate()', () => {
  it('produces a machine-readable date for <time datetime>', () => {
    expect(isoDate(new Date('2026-03-14T09:30:00Z'))).toBe('2026-03-14');
  });
});
