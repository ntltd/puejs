import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { isValidElement } from "react";
import { css, cx } from "styled-system/css";
import { CodeBlock } from "./components/code/code-block";
import { Callout } from "./components/docs/callout";
import { InstallCommand } from "./components/landing/install-command";

const heading = css({
  color: "fg",
  letterSpacing: "-0.02em",
  "& > a": { color: "inherit", textDecoration: "none" },
  "& > a:hover::after": { content: '" #"', color: "fg.subtle" },
});

const link = css({
  color: "primary",
  textDecoration: "underline",
  textDecorationColor: "rgba(132, 204, 22, 0.35)",
  textUnderlineOffset: "3px",
  transition: "text-decoration-color 120ms ease",
  _hover: { textDecorationColor: "primary" },
});

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1
      className={css({
        fontSize: { base: "3xl", md: "4xl" },
        fontWeight: "bold",
        letterSpacing: "-0.035em",
        lineHeight: "1.1",
        color: "fg",
        textWrap: "balance",
      })}
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      className={cx(
        heading,
        css({
          mt: "14",
          mb: "4",
          pt: "8",
          borderTopWidth: "1px",
          borderColor: "border",
          fontSize: "2xl",
          fontWeight: "semibold",
        }),
      )}
      id={id}
    >
      <a href={`#${id}`}>{children}</a>
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3 className={cx(heading, css({ mt: "10", mb: "3", fontSize: "lg", fontWeight: "semibold" }))} id={id}>
      <a href={`#${id}`}>{children}</a>
    </h3>
  ),
  h4: ({ children, id }) => (
    <h4
      className={cx(heading, css({ mt: "8", mb: "2", fontFamily: "mono", fontSize: "sm", fontWeight: "medium" }))}
      id={id}
    >
      <a href={`#${id}`}>{children}</a>
    </h4>
  ),
  p: ({ children }) => <p className={css({ my: "4", color: "fg.muted", lineHeight: "1.75" })}>{children}</p>,
  a: ({ href = "", children }) =>
    href.startsWith("/") ? (
      <Link className={link} href={href}>
        {children}
      </Link>
    ) : href.startsWith("#") ? (
      <a className={link} href={href}>
        {children}
      </a>
    ) : (
      <a className={link} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    ),
  strong: ({ children }) => <strong className={css({ color: "fg", fontWeight: "semibold" })}>{children}</strong>,
  em: ({ children }) => <em className={css({ color: "fg" })}>{children}</em>,
  ul: ({ children }) => (
    <ul
      className={css({
        my: "4",
        pl: "5",
        listStyleType: "disc",
        color: "fg.muted",
        "& li::marker": { color: "primary" },
      })}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      className={css({
        my: "4",
        pl: "5",
        listStyleType: "decimal",
        color: "fg.muted",
        "& li::marker": { color: "fg.subtle", fontFamily: "mono", fontSize: "sm" },
      })}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className={css({ my: "1.5", pl: "1", lineHeight: "1.7" })}>{children}</li>,
  hr: () => <hr className={css({ my: "12", borderColor: "border" })} />,
  blockquote: ({ children }) => (
    <blockquote
      className={css({
        my: "8",
        pl: "6",
        borderLeftWidth: "2px",
        borderColor: "primary",
        fontSize: "lg",
        color: "fg",
        "& p": { color: "fg" },
      })}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code
      className={css({
        px: "1.5",
        py: "0.5",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "sm",
        bg: "surface",
        fontFamily: "mono",
        fontSize: "0.85em",
        color: "fg",
        wordBreak: "break-word",
      })}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => {
    // Fenced code blocks arrive as <pre><code className="language-xx">source</code></pre>.
    if (isValidElement<{ className?: string; children?: React.ReactNode }>(children)) {
      const { className = "", children: source } = children.props;
      const language = /language-(\w+)/.exec(className)?.[1];
      if (typeof source === "string") return <CodeBlock code={source} language={language} />;
    }
    return <pre>{children}</pre>;
  },
  table: ({ children }) => (
    <div
      className={css({
        my: "6",
        overflowX: "auto",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "lg",
      })}
    >
      <table className={css({ width: "100%", borderCollapse: "collapse", fontSize: "sm" })}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className={css({
        px: "4",
        py: "2.5",
        bg: "surface",
        borderBottomWidth: "1px",
        borderColor: "border",
        textAlign: "left",
        fontFamily: "mono",
        fontSize: "xs",
        fontWeight: "medium",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "fg.subtle",
        whiteSpace: "nowrap",
      })}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className={css({
        px: "4",
        py: "3",
        borderBottomWidth: "1px",
        borderColor: "border",
        color: "fg.muted",
        verticalAlign: "top",
        "tr:last-child > &": { borderBottomWidth: "0" },
        "& code": { whiteSpace: "nowrap" },
        "&:last-child": { minWidth: "220px" },
      })}
    >
      {children}
    </td>
  ),
  Callout,
  InstallCommand: ({ packages }: { packages?: string }) => <InstallCommand packages={packages} variant="docs" />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
