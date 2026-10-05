import { css, cx } from "styled-system/css";
import { highlight, type TokenKind } from "./highlight";

const tokenColor: Record<TokenKind, string> = {
  keyword: css({ color: "#C084FC" }),
  string: css({ color: "primary" }),
  number: css({ color: "accent" }),
  comment: css({ color: "fg.subtle", fontStyle: "italic" }),
  function: css({ color: "#60A5FA" }),
  type: css({ color: "#2DD4BF" }),
  property: css({ color: "#E2E8F0" }),
  plain: css({ color: "fg.muted" }),
};

type CodeLinesProps = {
  code: string;
  language?: string;
  lineNumbers?: boolean;
  className?: string;
};

export function CodeLines({ code, language, lineNumbers = false, className }: CodeLinesProps): React.JSX.Element {
  const lines = highlight(code, language);

  return (
    <pre
      className={cx(
        css({
          overflowX: "auto",
          py: "5",
          fontFamily: "mono",
          fontSize: { base: "xs", md: "13px" },
          lineHeight: "1.75",
        }),
        className,
      )}
    >
      <code className={css({ display: "grid", minWidth: "max-content" })}>
        {lines.map((tokens, lineIndex) => (
          <span className={css({ display: "flex", pr: "6", pl: lineNumbers ? "0" : "5" })} key={lineIndex}>
            {lineNumbers ? (
              <span
                aria-hidden="true"
                className={css({
                  width: "12",
                  flexShrink: "0",
                  pr: "5",
                  textAlign: "right",
                  color: "#404040",
                  userSelect: "none",
                })}
              >
                {lineIndex + 1}
              </span>
            ) : null}
            <span className={css({ whiteSpace: "pre" })}>
              {tokens.map((token, tokenIndex) => (
                <span className={tokenColor[token.kind]} key={tokenIndex}>
                  {token.text}
                </span>
              ))}
              {tokens.length === 0 ? " " : null}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}
