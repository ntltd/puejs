import { css } from "styled-system/css";
import { CodeLines } from "./code-lines";

const languageLabel: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  vue: "Vue",
  svelte: "Svelte",
  bash: "Terminal",
  sh: "Terminal",
  html: "HTML",
  css: "CSS",
  webidl: "WebIDL",
  http: "HTTP",
};

type CodeHeaderProps = {
  language: string;
  filename?: string;
  /** Prefixes the header with the three window dots of the landing showcase. */
  windowDots?: boolean;
};

/** Code panel title bar: optional window dots, the file name as a tab, the language on the right. */
export function CodeHeader({ language, filename, windowDots = false }: CodeHeaderProps): React.JSX.Element {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "4",
        height: "11",
        px: "4",
        borderBottomWidth: "1px",
        borderColor: "border",
      })}
    >
      {windowDots ? (
        <div aria-hidden="true" className={css({ display: "flex", gap: "1.5" })}>
          {[0, 1, 2].map((dot) => (
            <span
              className={css({ width: "2.5", height: "2.5", borderRadius: "full", bg: "border.strong" })}
              key={dot}
            />
          ))}
        </div>
      ) : null}
      {filename ? (
        <figcaption
          className={css({
            minWidth: "0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "mono",
            fontSize: "xs",
            color: "fg",
            px: "2.5",
            py: "1",
            borderRadius: "sm",
            bg: "carbon",
          })}
        >
          {filename}
        </figcaption>
      ) : null}
      <span
        className={css({
          ml: "auto",
          flexShrink: "0",
          fontFamily: "mono",
          fontSize: "2xs",
          color: "fg.subtle",
        })}
      >
        {languageLabel[language] ?? language}
      </span>
    </div>
  );
}

export function CodeBlock({
  code,
  language = "ts",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}): React.JSX.Element {
  return (
    <figure
      className={css({
        my: "6",
        minWidth: "0",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "lg",
        bg: "surface",
        overflow: "hidden",
      })}
    >
      <CodeHeader filename={filename} language={language} />
      <CodeLines className={css({ py: "4" })} code={code} language={language} />
    </figure>
  );
}
