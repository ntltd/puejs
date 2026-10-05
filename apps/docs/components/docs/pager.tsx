"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, cx } from "styled-system/css";
import { docsLinks } from "./navigation";

const card = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  flex: "1",
  p: "4",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "lg",
  transition: "border-color 160ms ease",
  _hover: { borderColor: "primary" },
  "& span": { fontFamily: "mono", fontSize: "xs", color: "fg.subtle" },
  "& strong": { fontSize: "sm", fontWeight: "medium", color: "fg" },
});

export function Pager(): React.JSX.Element | null {
  const pathname = usePathname();
  const index = docsLinks.findIndex((link) => link.href === pathname);
  if (index === -1) return null;

  const previous = docsLinks[index - 1];
  const next = docsLinks[index + 1];

  return (
    <nav
      aria-label="Pagination"
      className={css({ mt: "16", pt: "8", display: "flex", gap: "4", borderTopWidth: "1px", borderColor: "border" })}
    >
      {previous ? (
        <Link className={card} href={previous.href}>
          <span>← Previous</span>
          <strong>{previous.title}</strong>
        </Link>
      ) : (
        <div className={css({ flex: "1" })} />
      )}
      {next ? (
        <Link className={cx(card, css({ textAlign: "right" }))} href={next.href}>
          <span>Next →</span>
          <strong>{next.title}</strong>
        </Link>
      ) : (
        <div className={css({ flex: "1" })} />
      )}
    </nav>
  );
}
