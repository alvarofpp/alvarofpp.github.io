import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// One Markdown file per achievement → /work/<slug>
const work = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    year: z.string(),
    tag: z.string(),
    summary: z.string(),
    metric: z.string(),
    order: z.number(),
    // Start of the resume bullet(s) this post expands — those bullets link here
    highlights: z.array(z.string()).default([]),
  }),
});

export const collections = { work };
