"use client";

import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { CheckIcon, CopyIcon } from "./icons";

/** Icon button copying `text` to the clipboard, with a short confirmation. */
export function CopyButton({ text, label }: { text: string; label: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access denied: the text stays selectable.
    }
  };

  return (
    <button
      aria-label={copied ? "Copied" : label}
      className={css({
        display: "grid",
        placeItems: "center",
        width: "9",
        height: "9",
        flexShrink: "0",
        borderRadius: "md",
        color: copied ? "primary" : "fg.subtle",
        cursor: "pointer",
        transition: "color 120ms ease, background 120ms ease",
        _hover: { bg: "surface.hover", color: "fg" },
        _focusVisible: { outline: "2px solid token(colors.primary)" },
      })}
      onClick={copy}
      type="button"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
