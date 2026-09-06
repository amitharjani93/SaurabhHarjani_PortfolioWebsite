import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections.
 *
 * PRACTICE AREAS live in src/content/practice-areas/*.md. Adding a new file
 * there creates a new page at /practice-areas/<filename>, adds it to the
 * practice-area index, the home page, the footer and the consultation form's
 * subject list. No code changes are required.
 *
 * INSIGHTS live in src/content/insights/*.mdx.
 */

const practiceAreas = defineCollection({
  loader: glob({ base: './src/content/practice-areas', pattern: '**/*.md' }),
  schema: z.object({
    /** Full name of the area, e.g. 'Intellectual Property & Trade Marks'. */
    title: z.string(),
    /** Compact form for navigation and lists. */
    shortTitle: z.string(),
    /** Controls ordering everywhere the areas are listed. */
    order: z.number(),
    /** One sentence. Used on cards and in metadata. */
    summary: z.string(),
    /** A short declarative line used at the top of the practice page. */
    statement: z.string(),
    /** Two-digit index shown as a typographic device, e.g. '01'. */
    numeral: z.string(),

    /** Service categories offered within the area. */
    services: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        }),
      )
      .default([]),

    /** Situations a prospective client may recognise as their own. */
    situations: z.array(z.string()).default([]),

    /** How assistance in this area typically proceeds. */
    process: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
        }),
      )
      .default([]),

    /** Key used to select questions from src/config/faq.ts. */
    faqKey: z.string(),

    /** Metadata overrides. */
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    /** Meta description and list summary. */
    description: z.string(),
    category: z.enum(['Trade Marks', 'Intellectual Property', 'Property', 'Civil Law', 'Legal Updates']),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Slug of a practice area to cross-link, if relevant. */
    relatedPracticeArea: z.string().optional(),
    /**
     * Marks an article as illustrative placeholder content. Sample articles
     * carry a visible banner so they can never be mistaken for published
     * commentary. Delete the file or set this to false when replacing it.
     */
    sample: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { 'practice-areas': practiceAreas, insights };
