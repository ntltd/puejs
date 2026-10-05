import Link from "next/link";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { AcousticToggle } from "./acoustic-toggle";
import { container } from "./container";
import { GlyphFlat, GlyphSwirl } from "./glyphs";
import { LogoMark } from "./logo-mark";

const links = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference", href: "/docs/api" },
  { label: "Ecosystem", href: "/docs/ecosystem" },
  { label: "Playground", href: "/playground" },
];

export function Navbar(): React.JSX.Element {
  return (
    <header
      className={css({
        position: "sticky",
        top: "0",
        zIndex: "50",
        borderBottomWidth: "1px",
        borderColor: "border",
        bg: "rgba(10, 10, 10, 0.72)",
        backdropFilter: "saturate(180%) blur(14px)",
      })}
    >
      <nav
        aria-label="Main"
        className={cx(
          container,
          css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "16",
          }),
        )}
      >
        <div className={css({ display: "flex", alignItems: "center", gap: "10" })}>
          <Link
            aria-label="Pue JS home"
            className={css({ display: "flex", alignItems: "center", gap: "2.5" })}
            href="/"
          >
            <LogoMark preload />
            <span className={css({ fontWeight: "semibold", letterSpacing: "-0.02em" })}>Pue JS</span>
            <span
              className={css({
                fontFamily: "mono",
                fontSize: "2xs",
                color: "fg.subtle",
                borderWidth: "1px",
                borderColor: "border",
                borderRadius: "sm",
                px: "1.5",
                py: "0.5",
              })}
            >
              v1.0
            </span>
          </Link>
          <ul className={css({ display: { base: "none", md: "flex" }, gap: "7" })}>
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  className={css({
                    fontSize: "sm",
                    color: "fg.muted",
                    transition: "color 120ms ease",
                    _hover: { color: "fg" },
                  })}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <AcousticToggle />
          {/* Decorative repository badge: intentionally not a link */}
          <div
            className={cx(
              button({ variant: "ghost" }),
              css({ cursor: "default", _hover: { color: "fg.muted", borderColor: "border" } }),
            )}
          >
            <span
              aria-hidden="true"
              className={css({
                display: "grid",
                placeItems: "center",
                width: "5",
                height: "5",
                borderRadius: "full",
                bg: "fg.muted",
                color: "carbon",
                overflow: "hidden",
              })}
            >
              <GlyphSwirl
                size={18}
                className={css({
                  marginTop: "5px",
                  transform: "scaleX(-1)",
                })}
              />
            </span>
            <span className={css({ display: { base: "none", sm: "inline" } })}>GutHub</span>
            {/* Keeps the name available to screen readers when the label is hidden on mobile */}
            <span className={css({ srOnly: true, sm: { display: "none" } })}>GutHub</span>
            <span
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1",
                pl: "2",
                ml: "0.5",
                borderLeftWidth: "1px",
                borderColor: "border",
                fontFamily: "mono",
                fontSize: "xs",
                color: "fg",
              })}
            >
              <GlyphFlat size={12} />
              12k
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
}
