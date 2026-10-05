"use client";

import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import type { EmissionEvent } from "@puejs/core";
import { onEmission } from "../site/acoustic-feedback";

const RIPPLE_DURATION = 1600;
const MAX_RIPPLES = 6;

type Ripple = { id: number; scale: number };

type Subscribe = (listener: (emission: EmissionEvent) => void) => () => void;

/** One ring per emission, sized by its tonnage. Listens to the site-wide emitter unless told otherwise. */
export function EmissionRipples({ subscribe = onEmission }: { subscribe?: Subscribe }): React.JSX.Element {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const unsubscribe = subscribe((emission) => {
      const id = nextId++;
      setRipples((current) => [...current.slice(-(MAX_RIPPLES - 1)), { id, scale: 2.5 + emission.tonnage * 2.5 }]);
      const timeout = setTimeout(() => {
        timeouts.delete(timeout);
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, RIPPLE_DURATION);
      timeouts.add(timeout);
    });
    return () => {
      unsubscribe();
      for (const timeout of timeouts) clearTimeout(timeout);
    };
  }, [subscribe]);

  return (
    <>
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className={css({
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "176px",
            height: "176px",
            borderWidth: "1px",
            borderColor: "rgba(163, 230, 53, 0.75)",
            borderRadius: "full",
            pointerEvents: "none",
            animation: "emissionPing 1.6s cubic-bezier(0.2, 0.6, 0.3, 1) forwards",
            _motionReduce: { display: "none" },
          })}
          key={ripple.id}
          style={{ "--ping-scale": ripple.scale } as React.CSSProperties}
        />
      ))}
    </>
  );
}
