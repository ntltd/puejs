"use client";

import { useId, useSyncExternalStore } from "react";
import { css, cx } from "styled-system/css";
import { CopyButton } from "../site/copy-button";

const managers = [
  { name: "npm", command: "npm install @puejs/core" },
  { name: "pnpm", command: "pnpm add @puejs/core" },
  { name: "yarn", command: "yarn add @puejs/core" },
] as const;

type Manager = (typeof managers)[number]["name"];

const STORAGE_KEY = "puejs:package-manager";

const isManager = (value: unknown): value is Manager => managers.some((item) => item.name === value);

// The selected package manager is persisted in localStorage and kept in memory as a fallback.
let memory: Manager = "npm";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Manager {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isManager(stored) ? stored : memory;
  } catch {
    return memory;
  }
}

const getServerSnapshot = (): Manager => "npm";

function setManager(name: Manager): void {
  memory = name;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Storage unavailable: the choice only lives in memory.
  }
  listeners.forEach((listener) => listener());
}

export function InstallCommand({ className }: { className?: string }): React.JSX.Element {
  const id = useId();
  const manager = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const command = managers.find((item) => item.name === manager)?.command ?? managers[0].command;

  const select = (name: Manager): void => setManager(name);

  return (
    <div
      className={cx(
        css({
          width: "100%",
          maxWidth: "380px",
          bg: "surface",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "lg",
          fontFamily: "mono",
          fontSize: "sm",
          overflow: "hidden",
        }),
        className,
      )}
    >
      <div
        aria-label="Package manager"
        className={css({
          display: "flex",
          gap: "1",
          px: "2",
          pt: "2",
          borderBottomWidth: "1px",
          borderColor: "border",
        })}
        role="tablist"
      >
        {managers.map((item) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={item.name === manager}
            className={css({
              px: "2.5",
              py: "1.5",
              mb: "-1px",
              borderBottomWidth: "1px",
              borderColor: "transparent",
              fontSize: "xs",
              color: "fg.subtle",
              cursor: "pointer",
              transition: "color 120ms ease, border-color 120ms ease",
              _hover: { color: "fg" },
              _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "-2px" },
              "&[aria-selected=true]": { color: "fg", borderColor: "primary" },
            })}
            key={item.name}
            onClick={() => select(item.name)}
            role="tab"
            type="button"
          >
            {item.name}
          </button>
        ))}
      </div>

      <div
        className={css({ display: "flex", alignItems: "center", gap: "4", height: "12", pl: "4", pr: "1.5" })}
        id={`${id}-panel`}
        role="tabpanel"
      >
        <span aria-hidden="true" className={css({ color: "primary", userSelect: "none" })}>
          $
        </span>
        <code className={css({ flex: "1", color: "fg", textAlign: "left" })}>{command}</code>
        <CopyButton key={command} label="Copy install command" text={command} />
      </div>
    </div>
  );
}
