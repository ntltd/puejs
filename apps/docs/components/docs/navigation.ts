export type DocsLink = { title: string; href: string };

export const docsNavigation: { title: string; links: DocsLink[] }[] = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "Core Concepts",
    links: [
      { title: "Architecture", href: "/docs/concepts" },
      { title: "Accessibility & Consent", href: "/docs/accessibility" },
    ],
  },
  {
    title: "Ecosystem",
    links: [{ title: "Framework Adapters", href: "/docs/ecosystem" }],
  },
  {
    title: "Reference",
    links: [{ title: "API Reference", href: "/docs/api" }],
  },
];

export const docsLinks: DocsLink[] = docsNavigation.flatMap((section) => section.links);
