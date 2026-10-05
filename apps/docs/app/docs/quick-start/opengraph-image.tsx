import { ogSize, renderOgImage } from "../../../lib/og";
import { pages } from "../../../lib/site";

export const alt = pages["/docs/quick-start"].title;
export const size = ogSize;
export const contentType = "image/png";

export default function Image(): ReturnType<typeof renderOgImage> {
  return renderOgImage("/docs/quick-start");
}
