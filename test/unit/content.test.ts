import { describe, expect, it } from 'vitest';
import { insights, practiceAreas, type InsightData } from '../support/content';
import { faqs } from '../../src/config/faq';

/**
 * Content contract tests.
 *
 * Practice areas and articles are written in Markdown by someone who is not
 * running the app. Astro's schemas catch a malformed field; these catch the
 * mistakes a schema cannot see — a faqKey that matches nothing, an article
 * pointing at a practice area that has been renamed, two areas claiming the
 * same position in the running order.
 */

const areas = practiceAreas();
const articles = insights();
const areaSlugs = areas.map((a) => a.slug);
const faqKeys = new Set(areas.map((a) => a.data.faqKey));

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('practice areas', () => {
  it('exist', () => {
    expect(areas.length).toBeGreaterThan(0);
  });

  it.each(areas)('$slug has a URL-safe slug', ({ slug }) => {
    expect(slug).toMatch(SLUG);
  });

  it.each(areas)('$slug has every field the pages render', ({ data }) => {
    for (const field of ['title', 'shortTitle', 'summary', 'statement', 'numeral', 'faqKey'] as const) {
      expect(data[field], field).toBeTruthy();
    }
    expect(typeof data.order).toBe('number');
  });

  it('orders every area distinctly, so listings are deterministic', () => {
    const orders = areas.map((a) => a.data.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('gives every area a distinct two-digit numeral', () => {
    const numerals = areas.map((a) => a.data.numeral);
    expect(new Set(numerals).size).toBe(numerals.length);
    for (const numeral of numerals) expect(numeral).toMatch(/^\d{2}$/);
  });

  it('keeps summaries short enough to work as a meta description', () => {
    for (const area of areas) {
      expect(area.data.summary.length, area.slug).toBeLessThanOrEqual(200);
      expect((area.data.seoDescription ?? '').length, area.slug).toBeLessThanOrEqual(200);
    }
  });

  it.each(areas)('$slug has an introduction body', ({ body }) => {
    expect(body.trim().length).toBeGreaterThan(200);
  });

  it.each(areas)('$slug describes at least one service category', ({ data }) => {
    expect(data.services?.length ?? 0).toBeGreaterThan(0);
    for (const service of data.services ?? []) {
      expect(service.title).toBeTruthy();
      expect(service.description).toBeTruthy();
    }
  });

  it.each(areas)('$slug explains how assistance proceeds', ({ data }) => {
    expect(data.process?.length ?? 0).toBeGreaterThan(0);
  });

  it.each(areas)('$slug lists situations a client might recognise', ({ data }) => {
    expect(data.situations?.length ?? 0).toBeGreaterThan(0);
  });
});

describe('practice area ↔ FAQ wiring', () => {
  it.each(areas)('$slug has at least one question of its own', ({ data, slug }) => {
    const matching = faqs.filter((f) => f.areas.includes(data.faqKey));
    expect(matching.length, `no FAQ entries tagged "${data.faqKey}" for ${slug}`).toBeGreaterThan(0);
  });

  it('has no FAQ pointing at a practice area that does not exist', () => {
    const orphans = faqs.flatMap((f) =>
      f.areas.filter((area) => area !== 'general' && !faqKeys.has(area)).map((area) => `${f.question} → ${area}`),
    );
    expect(orphans).toEqual([]);
  });

  it('has general questions for the FAQ page and the contact page', () => {
    expect(faqs.filter((f) => f.areas.includes('general')).length).toBeGreaterThanOrEqual(4);
  });

  it('gives every question a non-empty answer', () => {
    for (const faq of faqs) {
      expect(faq.answer.length, faq.question).toBeGreaterThan(0);
      for (const paragraph of faq.answer) expect(paragraph.trim().length).toBeGreaterThan(20);
    }
  });

  it('phrases every entry as a question', () => {
    for (const faq of faqs) expect(faq.question.trim().endsWith('?'), faq.question).toBe(true);
  });
});

describe('insights', () => {
  const published = articles.filter((a) => !a.data.draft);

  it.each(articles)('$slug has a URL-safe slug', ({ slug }) => {
    expect(slug).toMatch(SLUG);
  });

  it.each(articles)('$slug has a title and a description', ({ data }) => {
    expect(data.title).toBeTruthy();
    expect(data.description).toBeTruthy();
    expect(data.description.length).toBeLessThanOrEqual(200);
  });

  it.each(articles)('$slug has a parseable publication date', ({ data }) => {
    expect(Number.isNaN(new Date(data.publishDate as string).getTime())).toBe(false);
  });

  it.each(articles)('$slug uses a category the index knows about', ({ data }) => {
    const allowed: InsightData['category'][] = [
      'Trade Marks',
      'Intellectual Property',
      'Property',
      'Civil Law',
      'Legal Updates',
    ];
    expect(allowed).toContain(data.category);
  });

  it('links only to practice areas that exist', () => {
    const broken = articles
      .filter((a) => a.data.relatedPracticeArea && !areaSlugs.includes(a.data.relatedPracticeArea))
      .map((a) => `${a.slug} → ${a.data.relatedPracticeArea}`);
    expect(broken).toEqual([]);
  });

  it('gives every published article enough body to be worth publishing', () => {
    for (const article of published) {
      expect(article.body.trim().length, article.slug).toBeGreaterThan(500);
    }
  });

  it('has a distinct title for every article', () => {
    const titles = articles.map((a) => a.data.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('flags placeholder articles so they cannot be mistaken for real commentary', () => {
    // This is a reminder, not a failure: the README lists removing them as a
    // pre-launch task. It fails only if a sample article loses its flag.
    for (const article of articles) {
      const looksLikeSample = /sample|placeholder|lorem/i.test(article.data.title);
      if (looksLikeSample) expect(article.data.sample, article.slug).toBe(true);
    }
  });
});
