import { css, cx } from "styled-system/css";
import { container } from "../site/container";

const wordmark = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  color: "fg.subtle",
  fontSize: "lg",
  fontWeight: "semibold",
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
  transition: "color 160ms ease",
  _hover: { color: "fg.muted" },
});

// Generic geometric glyphs only: none of them imitates the mark of the company it parodies.
const companies: { name: string; glyph: React.ReactNode; className?: string }[] = [
  {
    name: "Gasflare",
    glyph: (
      <path
        d="M8 1.5c1 3 4.5 4.5 4.5 8.25a4.5 4.5 0 0 1-9 0C3.5 7 6 5.5 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    ),
  },
  {
    name: "Flatubernetes",
    glyph: (
      <>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="8" cy="8" r="1.75" fill="currentColor" />
      </>
    ),
    className: css({ fontWeight: "medium" }),
  },
  {
    name: "Sulfabase",
    glyph: <rect height="11" rx="2.5" stroke="currentColor" strokeWidth="1.75" width="11" x="2.5" y="2.5" />,
    className: css({ fontWeight: "bold", letterSpacing: "-0.04em" }),
  },
  {
    name: "MethaneDB",
    glyph: <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.75" />,
    className: css({ fontFamily: "mono", fontSize: "md", letterSpacing: "0.02em" }),
  },
  {
    name: "OpenAir",
    glyph: (
      <>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    name: "ODORACLE",
    glyph: <path d="M8 1.75L14.25 8 8 14.25 1.75 8 8 1.75Z" stroke="currentColor" strokeWidth="1.75" />,
    className: css({ fontFamily: "mono", fontSize: "md", letterSpacing: "0.12em" }),
  },
  {
    name: "Metha",
    glyph: (
      <path d="M1.5 9.5c2-4 4.5-4 6.5 0s4.5 4 6.5 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" />
    ),
    className: css({ fontWeight: "medium", letterSpacing: "-0.03em" }),
  },
];

export function LogoCloud(): React.JSX.Element {
  return (
    <section
      aria-labelledby="trusted-by"
      className={css({ py: "14", borderYWidth: "1px", borderColor: "border", bg: "rgba(23, 23, 23, 0.35)" })}
    >
      <div className={container}>
        <p
          className={css({
            textAlign: "center",
            fontFamily: "mono",
            fontSize: "xs",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.subtle",
          })}
          id="trusted-by"
        >
          Trusted by acoustic engineers at:
        </p>
        <ul
          className={css({
            mt: "8",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: { base: "8", md: "12" },
            rowGap: "6",
          })}
        >
          {companies.map((company) => (
            <li className={cx(wordmark, company.className)} key={company.name}>
              <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
                {company.glyph}
              </svg>
              {company.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
