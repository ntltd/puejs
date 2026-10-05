import type { MetadataRoute } from "next";
import { pages, siteUrl, type PagePath } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(pages) as PagePath[]).map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
