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

export function CodeBlock({ code, language = "ts" }: { code: string; language?: string }): React.JSX.Element {
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
      <figcaption
        className={css({
          display: "flex",
          alignItems: "center",
          height: "9",
          px: "4",
          borderBottomWidth: "1px",
          borderColor: "border",
          fontFamily: "mono",
          fontSize: "2xs",
          letterSpacing: "0.04em",
          color: "fg.subtle",
        })}
      >
        {languageLabel[language] ?? language}
      </figcaption>
      <CodeLines className={css({ py: "4" })} code={code} language={language} />
    </figure>
  );
}
