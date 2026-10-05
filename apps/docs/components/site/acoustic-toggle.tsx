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
          position: "relative",
          // Off: draws the eye, since the whole site is silent until this is pressed.
          color: "fg",
          borderColor: "rgba(132, 204, 22, 0.45)",
          boxShadow: "0 0 18px -6px rgba(132, 204, 22, 0.6)",
          _hover: { borderColor: "primary", boxShadow: "glow" },
          "&[aria-pressed=true]": {
            color: "primary",
            borderColor: "rgba(132, 204, 22, 0.5)",
            boxShadow: "none",
          },
        }),
      )}
      onClick={() => setEnabled(!enabled)}
      type="button"
    >
      <SoundIcon muted={!enabled} />
      <span className={css({ display: { base: "none", md: "inline" } })}>
        {enabled ? "Acoustic feedback" : "Enable acoustic feedback"}
      </span>
      {!enabled && (
        <span
          aria-hidden="true"
          className={css({
            position: "absolute",
            top: "-1",
            right: "-1",
            width: "2.5",
            height: "2.5",
            borderRadius: "full",
            bg: "primary",
            boxShadow: "0 0 8px rgba(132, 204, 22, 0.9)",
            animation: "pulseDot 1.6s ease-in-out infinite",
            _motionReduce: { animation: "none" },
          })}
        />
      )}
    </button>
  );
}
