import Link from "next/link";
import { css } from "styled-system/css";
import { ArticleLayout } from "../../components/site/article-layout";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("/rfcs");

const rfcs = [
  {
    number: "0001",
    title: "Web Olfactory API",
    summary: "A permission-gated browser API to drive olfactory output devices, synchronized with the Web Audio clock.",
    status: "Draft",
    created: "2026-10-05",
    href: "/rfcs/0001-web-olfactory-api",
  },
];

export default function RfcsPage(): React.JSX.Element {
  return (
    <ArticleLayout label="Requests for Comments">
      <h1
        className={css({
          fontSize: { base: "3xl", md: "4xl" },
          fontWeight: "bold",
          letterSpacing: "-0.035em",
          lineHeight: "1.1",
        })}
      >
        RFCs
      </h1>
      <p className={css({ mt: "4", color: "fg.muted", lineHeight: "1.75" })}>
        Substantial changes to Pue JS — and proposals that extend beyond the library to the web platform itself — go
        through a public design process. Each RFC describes the problem, the proposed solution, its trade-offs and the
        questions that remain open.
      </p>

      <ul className={css({ mt: "12", display: "flex", flexDirection: "column", gap: "4" })}>
        {rfcs.map((rfc) => (
          <li key={rfc.number}>
            <Link
              className={css({
                display: "block",
                p: "6",
                borderWidth: "1px",
                borderColor: "border",
                borderRadius: "xl",
                bg: "surface",
                transition: "border-color 160ms ease",
                _hover: { borderColor: "primary" },
              })}
              href={rfc.href}
            >
              <div
                className={css({
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "3",
                  fontFamily: "mono",
                  fontSize: "xs",
                  color: "fg.subtle",
                })}
              >
                <span>RFC {rfc.number}</span>
                <span
                  className={css({
                    px: "2",
                    py: "0.5",
                    borderWidth: "1px",
                    borderColor: "rgba(234, 179, 8, 0.4)",
                    borderRadius: "full",
                    color: "accent",
                  })}
                >
                  {rfc.status}
                </span>
                <span>{rfc.created}</span>
              </div>
              <h2 className={css({ mt: "3", fontSize: "xl", fontWeight: "semibold", letterSpacing: "-0.02em" })}>
                {rfc.title}
              </h2>
              <p className={css({ mt: "2", fontSize: "sm", color: "fg.muted" })}>{rfc.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ArticleLayout>
  );
}
