"use client";

import { useId, useSyncExternalStore } from "react";
import { css, cx } from "styled-system/css";
import { CopyButton } from "../site/copy-button";

const managers = [
  { name: "npm", install: "npm install" },
  { name: "pnpm", install: "pnpm add" },
  { name: "yarn", install: "yarn add" },
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

type InstallCommandProps = {
  /** Space-separated packages to install. */
  packages?: string;
  /** `hero` is a compact card; `docs` spans the column and matches the code blocks. */
  variant?: "hero" | "docs";
  className?: string;
};

export function InstallCommand({
  packages = "@puejs/core",
  variant = "hero",
  className,
}: InstallCommandProps): React.JSX.Element {
  const id = useId();
  const manager = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const install = managers.find((item) => item.name === manager)?.install ?? managers[0].install;
  const command = `${install} ${packages}`;
  const docs = variant === "docs";

  return (
    <div
      className={cx(
        css({
          width: "100%",
          bg: "surface",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "lg",
          fontFamily: "mono",
          overflow: "hidden",
        }),
        docs ? css({ my: "6", fontSize: { base: "xs", md: "13px" } }) : css({ maxWidth: "380px", fontSize: "sm" }),
        className,
      )}
    >
      <div
        aria-label="Package manager"
        className={cx(
          css({ display: "flex", gap: "1", borderBottomWidth: "1px", borderColor: "border" }),
          // In docs, the tab bar has the height of a code block caption and its first label lines up with the code.
          docs ? css({ height: "9", alignItems: "stretch", px: "2.5" }) : css({ px: "2", pt: "2" }),
        )}
        role="tablist"
      >
        {managers.map((item) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={item.name === manager}
            className={cx(
              css({
                px: "2.5",
                mb: "-1px",
                fontSize: "xs",
                borderBottomWidth: "1px",
                borderColor: "transparent",
                color: "fg.subtle",
                cursor: "pointer",
                transition: "color 120ms ease, border-color 120ms ease",
                _hover: { color: "fg" },
                _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "-2px" },
                "&[aria-selected=true]": { color: "fg", borderColor: "primary" },
              }),
              !docs && css({ py: "1.5" }),
            )}
            key={item.name}
            onClick={() => setManager(item.name)}
            role="tab"
            type="button"
          >
            {item.name}
          </button>
        ))}
      </div>

      <div
        className={cx(
          css({ display: "flex", alignItems: "center", gap: "4", pr: "1.5" }),
          docs ? css({ height: "14", pl: "5" }) : css({ height: "12", pl: "4" }),
        )}
        id={`${id}-panel`}
        role="tabpanel"
      >
        <span aria-hidden="true" className={css({ color: "primary", userSelect: "none" })}>
          $
        </span>
        <code
          className={css({
            flex: "1",
            minWidth: "0",
            color: "fg",
            textAlign: "left",
            overflowX: "auto",
            whiteSpace: "nowrap",
          })}
        >
          {command}
        </code>
        <CopyButton key={command} label="Copy install command" text={command} />
      </div>
    </div>
  );
}
