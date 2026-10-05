export type TokenKind = "keyword" | "string" | "number" | "comment" | "function" | "type" | "property" | "plain";

export type Token = { kind: TokenKind; text: string };

const scriptPattern =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|type|interface|extends|const|let|new|return|export|default|async|await|function|if|else|true|false|null|undefined|as|keyof|readonly|attribute|partial|enum|dictionary|required|sequence|optional|unsigned|double|long|boolean|void)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Z]\w*)\b|\b(\w+)(?=\()|\b(\w+)(?=\??:)/gm;

const scriptKinds: TokenKind[] = ["comment", "string", "keyword", "number", "type", "function", "property"];

const shellPattern = /(#.*$)|("(?:[^"\\]|\\.)*")|^(\$)|(--?[\w-]+)/gm;

const shellKinds: TokenKind[] = ["comment", "string", "keyword", "property"];

const shellLanguages = new Set(["bash", "sh", "shell", "zsh"]);

function tokenizeLine(line: string, pattern: RegExp, kinds: TokenKind[]): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index;
    if (index > cursor) tokens.push({ kind: "plain", text: line.slice(cursor, index) });
    const group = match.slice(1).findIndex((value) => value !== undefined);
    tokens.push({ kind: kinds[group] ?? "plain", text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < line.length) tokens.push({ kind: "plain", text: line.slice(cursor) });
  return tokens;
}

/** Minimal TypeScript / shell highlighter, rendered on the server at build time. */
export function highlight(code: string, language = "ts"): Token[][] {
  const shell = shellLanguages.has(language);
  return code
    .replace(/\n$/, "")
    .split("\n")
    .map((line) =>
      shell ? tokenizeLine(line, shellPattern, shellKinds) : tokenizeLine(line, scriptPattern, scriptKinds),
    );
}
