import type { Metadata } from "next";

export const siteName = "Pue JS";

/** Absolute base URL, required to resolve canonical links and Open Graph image URLs. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://www.puejs.org"),
);

export type PageInfo = {
  /** Short section label, rendered as the eyebrow of the social card. */
  label: string;
  /** Document title, combined with the site name by the root layout template. */
  title: string;
  /** Headline rendered on the social card. Defaults to `title`. */
  headline?: string;
  description: string;
};

/** Single source of truth for page titles, descriptions and social cards. */
export const pages = {
  "/": {
    label: "Acoustic Scroll Events",
    title: "Pue JS — Acoustic Scroll Events for the modern web",
    headline: "Next-generation acoustic feedback for modern web applications.",
    description: "Zero-dependency, strictly typed, purely organic scroll interactions.",
  },
  "/docs": {
    label: "Docs",
    title: "Introduction",
    description: "Pue JS is a zero-dependency acoustic feedback layer for scroll interactions.",
  },
  "/docs/installation": {
    label: "Docs",
    title: "Installation",
    description: "Install Pue JS with your package manager of choice.",
  },
  "/docs/quick-start": {
    label: "Docs",
    title: "Quick Start",
    description: "Ship your first acoustic scroll event in under five minutes.",
  },
  "/docs/concepts": {
    label: "Core Concepts",
    title: "Architecture",
    description: "How Pue JS turns scroll kinematics into acoustic emissions.",
  },
  "/docs/accessibility": {
    label: "Core Concepts",
    title: "Accessibility & Consent",
    description: "Ship acoustic feedback that respects users, browsers and assistive technologies.",
  },
  "/docs/ecosystem": {
    label: "Ecosystem",
    title: "Framework Adapters",
    description: "Official Pue JS adapters for React, Vue, Svelte and Solid.",
  },
  "/docs/api": {
    label: "Reference",
    title: "API Reference",
    description: "Complete reference of the Pue JS public API.",
  },
  "/manifesto": {
    label: "Manifesto",
    title: "Manifesto",
    headline: "The Acoustic Web Manifesto",
    description: "For thirty years, the web has been a silent medium. Seven principles to make it resonate.",
  },
  "/rfcs": {
    label: "Requests for Comments",
    title: "RFCs",
    description: "Design proposals for Pue JS and the web platform.",
  },
  "/rfcs/0001-web-olfactory-api": {
    label: "RFC 0001 · Draft",
    title: "RFC 0001: Web Olfactory API",
    headline: "Web Olfactory API",
    description: "A proposal for a permission-gated browser API to drive olfactory output devices.",
  },
} satisfies Record<string, PageInfo>;

export type PagePath = keyof typeof pages;

/** Builds the metadata of a page from the registry. */
export function pageMetadata(path: PagePath): Metadata {
  const page: PageInfo = pages[path];
  const title = path === "/" ? { absolute: page.title } : page.title;
  return {
    title,
    description: page.description,
    alternates: { canonical: path },
    // Page-level openGraph replaces the layout's entirely, so shared fields are repeated here.
    openGraph: {
      type: "website",
      siteName,
      locale: "en_US",
      title: page.title,
      description: page.description,
      url: path,
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}
