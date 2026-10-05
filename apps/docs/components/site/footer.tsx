import Link from "next/link";
import { css, cx } from "styled-system/css";
import { container } from "./container";
import { LogoMark } from "./logo-mark";

const repository = "https://github.com/ntltd/puejs";

const columns = [
  {
    title: "Documentation",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Quick Start", href: "/docs/quick-start" },
      { label: "API Reference", href: "/docs/api" },
      { label: "Ecosystem", href: "/docs/ecosystem" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Manifesto", href: "/manifesto" },
      { label: "RFCs", href: "/rfcs" },
      { label: "GitHub", href: repository },
      { label: "License", href: `${repository}/blob/main/LICENSE` },
    ],
  },
];

const link = css({
  fontSize: "sm",
  color: "fg.muted",
  transition: "color 120ms ease",
  _hover: { color: "fg" },
});

export function Footer(): React.JSX.Element {
  return (
    <footer className={css({ borderTopWidth: "1px", borderColor: "border", bg: "#070707" })}>
      <div className={cx(container, css({ pt: "16", pb: "10" }))}>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "repeat(2, 1fr)", md: "3fr 1fr 1fr" },
            gap: { base: "10", md: "8" },
          })}
        >
          <div className={css({ gridColumn: { base: "span 2", md: "auto" } })}>
            <Link className={css({ display: "inline-flex", alignItems: "center", gap: "2.5" })} href="/">
              <LogoMark />
              <span className={css({ fontWeight: "semibold", letterSpacing: "-0.02em" })}>Pue JS</span>
            </Link>
            <p className={css({ mt: "4", maxWidth: "280px", fontSize: "sm", color: "fg.subtle" })}>
              Acoustic scroll events for the modern web. Open source, released into the public domain.
            </p>
          </div>

          {columns.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h2
                className={css({
                  fontFamily: "mono",
                  fontSize: "xs",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "fg.subtle",
                })}
              >
                {column.title}
              </h2>
              <ul className={css({ mt: "4", display: "flex", flexDirection: "column", gap: "2.5" })}>
                {column.links.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith("/") ? (
                      <Link className={link} href={item.href}>
                        {item.label}
                      </Link>
                    ) : (
                      <a className={link} href={item.href} rel="noreferrer" target="_blank">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className={css({
            mt: "16",
            pt: "6",
            display: "flex",
            flexDirection: { base: "column", sm: "row" },
            gap: "4",
            justifyContent: "space-between",
            alignItems: { base: "flex-start", sm: "center" },
            borderTopWidth: "1px",
            borderColor: "border",
            fontSize: "xs",
            color: "fg.subtle",
          })}
        >
          <span>A Semi-Colon Systems project · Released into the public domain under the Unlicense.</span>
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2",
              px: "3",
              py: "1.5",
              borderWidth: "1px",
              borderColor: "border",
              borderRadius: "full",
              fontFamily: "mono",
              color: "fg.muted",
            })}
          >
            <span
              aria-hidden="true"
              className={css({
                width: "2",
                height: "2",
                borderRadius: "full",
                bg: "primary",
                boxShadow: "0 0 8px rgba(132, 204, 22, 0.9)",
                animation: "pulseDot 2.4s ease-in-out infinite",
                _motionReduce: { animation: "none" },
              })}
            />
            All winds blowing
          </span>
        </div>
      </div>
    </footer>
  );
}
