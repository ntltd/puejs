"use client";

import { useEffect, useSyncExternalStore } from "react";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { getServerSnapshot, getSnapshot, restore, setEnabled, subscribe } from "./acoustic-feedback";
import { SoundIcon } from "./icons";

export function AcousticToggle(): React.JSX.Element {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    restore();
  }, []);

  return (
    <button
      aria-label="Acoustic feedback"
      aria-pressed={enabled}
      className={cx(
        button({ variant: "ghost" }),
        css({
          "&[aria-pressed=true]": { color: "primary", borderColor: "rgba(132, 204, 22, 0.5)" },
        }),
      )}
      onClick={() => setEnabled(!enabled)}
      type="button"
    >
      <SoundIcon muted={!enabled} />
      <span className={css({ display: { base: "none", md: "inline" } })}>Acoustic feedback</span>
    </button>
  );
}
