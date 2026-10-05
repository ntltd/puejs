"use client";

import { useSyncExternalStore } from "react";
import { css } from "styled-system/css";
import { getServerSnapshot, getSnapshot, setEnabled, subscribe } from "../site/acoustic-feedback";
import { SoundIcon } from "../site/icons";

/** Points visitors to the acoustic feedback toggle: the site is silent until it is pressed. */
export function SoundHint(): React.JSX.Element {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      aria-pressed={enabled}
      className={css({
        mt: "6",
        display: "inline-flex",
        alignItems: "center",
        gap: "2",
        px: "3",
        py: "1.5",
        borderRadius: "full",
        borderWidth: "1px",
        borderStyle: "dashed",
        borderColor: "rgba(132, 204, 22, 0.45)",
        fontFamily: "mono",
        fontSize: "xs",
        color: "primary",
        cursor: "pointer",
        transition: "border-color 160ms ease, background 160ms ease",
        _hover: { borderColor: "primary", bg: "rgba(132, 204, 22, 0.08)" },
        _focusVisible: { outline: "2px solid token(colors.primary)", outlineOffset: "2px" },
        "&[aria-pressed=true]": { borderStyle: "solid", color: "fg.muted" },
      })}
      onClick={() => setEnabled(!enabled)}
      type="button"
    >
      <SoundIcon muted={!enabled} size={14} />
      {enabled ? "Acoustic feedback on. Now scroll." : "Turn on acoustic feedback, then scroll."}
    </button>
  );
}
