"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { css } from "styled-system/css";
import { docsNavigation } from "./navigation";

function SidebarLinks(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className={css({ display: "flex", flexDirection: "column", gap: "8" })}>
      {docsNavigation.map((section) => (
        <div key={section.title}>
          <p
            className={css({
              mb: "3",
              fontFamily: "mono",
              fontSize: "xs",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "fg.subtle",
            })}
          >
            {section.title}
          </p>
          <ul
            className={css({ display: "flex", flexDirection: "column", borderLeftWidth: "1px", borderColor: "border" })}
          >
            {section.links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={css({
                      display: "block",
                      ml: "-1px",
                      pl: "4",
                      py: "1.5",
                      borderLeftWidth: "1px",
                      borderColor: "transparent",
                      fontSize: "sm",
                      color: "fg.muted",
                      transition: "color 120ms ease, border-color 120ms ease",
                      _hover: { color: "fg", borderColor: "border.strong" },
                      "&[aria-current=page]": { color: "primary", borderColor: "primary", fontWeight: "medium" },
                    })}
                    href={link.href}
                  >
                    {link.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar(): React.JSX.Element {
  return (
    <>
      {/* Mobile: collapsible menu above the content */}
      <details
        className={css({
          display: { base: "block", lg: "none" },
          mb: "8",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "lg",
          bg: "surface",
          "& > div": { px: "4", pb: "5", pt: "2" },
        })}
      >
        <summary
          className={css({
            px: "4",
            py: "3",
            fontFamily: "mono",
            fontSize: "xs",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            cursor: "pointer",
          })}
        >
          Documentation menu
        </summary>
        <div>
          <SidebarLinks />
        </div>
      </details>

      {/* Desktop: sticky column */}
      <aside
        className={css({
          display: { base: "none", lg: "block" },
          position: "sticky",
          top: "16",
          alignSelf: "start",
          maxHeight: "calc(100vh - token(sizes.16))",
          overflowY: "auto",
          py: "12",
          pr: "6",
        })}
      >
        <SidebarLinks />
      </aside>
    </>
  );
}
