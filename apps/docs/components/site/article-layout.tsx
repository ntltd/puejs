import { css, cx } from "styled-system/css";
import { container, eyebrow } from "./container";

type ArticleLayoutProps = {
  label: string;
  /** Renders the first paragraph as a larger lead. */
  lead?: boolean;
  children: React.ReactNode;
};

/** Long-form reading layout shared by the manifesto and RFCs. */
export function ArticleLayout({ label, lead = false, children }: ArticleLayoutProps): React.JSX.Element {
  return (
    <main className={css({ position: "relative", overflow: "hidden" })}>
      <div
        aria-hidden="true"
        className={css({
          position: "absolute",
          top: "-240px",
          left: "50%",
          width: "760px",
          height: "480px",
          transform: "translateX(-50%)",
          bgImage: "radial-gradient(closest-side, rgba(132,204,22,0.14), transparent)",
          filter: "blur(40px)",
          pointerEvents: "none",
        })}
      />
      <article
        className={cx(
          container,
          css({ position: "relative", maxWidth: "760px", pt: { base: "16", md: "24" }, pb: "28" }),
          lead && css({ "& > p:first-of-type": { fontSize: { base: "lg", md: "xl" }, color: "fg" } }),
        )}
      >
        <span className={cx(eyebrow, css({ mb: "6" }))}>{label}</span>
        {children}
      </article>
    </main>
  );
}
