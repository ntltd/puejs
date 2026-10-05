import { ogSize, renderOgImage } from "../../../lib/og";
import { pages } from "../../../lib/site";

export const alt = pages["/docs/api"].title;
export const size = ogSize;
export const contentType = "image/png";

export default function Image(): ReturnType<typeof renderOgImage> {
  return renderOgImage("/docs/api");
}
