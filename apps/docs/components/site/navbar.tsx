import Link from "next/link";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { repositoryUrl } from "../../lib/site";
import { AcousticToggle } from "./acoustic-toggle";
import { container } from "./container";
import { GlyphFlat, GlyphSwirl } from "./glyphs";
import { LogoMark } from "./logo-mark";

const links = [
  { label: "Docs", href: "/docs" },
  { label: "Playground", href: "/playground" },
];

/** Fake star count, between 9k and 99k. Derived from the current hour so every page shows the same one. */
function starCount(): string {
  let hash = Math.floor(Date.now() / 3_600_000);
  // Integer hash, so consecutive hours give unrelated counts.
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return `${9 + ((hash >>> 0) % 91)}k`;
}

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
            <span className={css({ fontWeight: "semibold", letterSpacing: "-0.02em" })}>Pue&thinsp;JS</span>
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
          <a
            className={button({ variant: "ghost" })}
            href={repositoryUrl}
            rel="noreferrer"
            target="_blank"
            title="GitHub"
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
                transition: "background 160ms ease",
                // Brightens with the label when the badge is hovered
                "a:hover > &": { bg: "fg" },
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
                transition: "border-color 160ms ease",
                // Follows the badge border on hover
                "a:hover > &": { borderColor: "border.strong" },
                fontFamily: "mono",
                fontSize: "xs",
                color: "fg",
              })}
            >
              <GlyphFlat size={12} />
              {starCount()}
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}
