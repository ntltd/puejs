import Link from "next/link";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { CodeLines } from "../code/code-lines";
import { container, eyebrow, sectionLead, sectionTitle } from "../site/container";
import { ArrowRightIcon } from "../site/icons";

const source = `import { createEmitter, presets } from "@puejs/core";
import type { EmitterOptions } from "@puejs/core";

const options: EmitterOptions = {
  preset: presets.organic,
  pitch: { min: 0.82, max: 1.24 },
  resonance: 0.65,
  duration: 420,
  throttle: "velocity",
};

const emitter = createEmitter(document.documentElement, options);

emitter.on("emit", ({ tonnage, latency }) => {
  telemetry.track("acoustic_event", { tonnage, latency });
});`;

const highlights = [
  {
    title: "Fully typed",
    body: "Every option is inferred end-to-end. Invalid resonance curves fail at compile time, not in production.",
  },
  {
    title: "Framework agnostic",
    body: "Bind to any scroll container, from the window to a single panel. Works with every framework today.",
  },
  {
    title: "Observable",
    body: "Subscribe to emission events and pipe tonnage metrics straight into your telemetry stack.",
  },
];

export function CodeShowcase(): React.JSX.Element {
  return (
    <section className={css({ py: { base: "20", md: "28" }, borderTopWidth: "1px", borderColor: "border" })} id="api">
      <div
        className={cx(
          container,
          css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: "5fr 7fr" },
            gap: { base: "12", lg: "16" },
            alignItems: "center",
          }),
        )}
      >
        <div>
          <span className={eyebrow}>02 — API</span>
          <h2 className={sectionTitle}>One function. Total acoustic control.</h2>
          <p className={sectionLead}>
            Pue JS exposes a single, declarative entry point. Describe your acoustic profile once — pitch envelope,
            resonance, duration — and the runtime handles sampling, throttling and scheduling.
          </p>

          <ul className={css({ mt: "10", display: "flex", flexDirection: "column", gap: "6" })}>
            {highlights.map((item) => (
              <li className={css({ display: "flex", gap: "4" })} key={item.title}>
                <span
                  aria-hidden="true"
                  className={css({
                    mt: "2",
                    width: "1.5",
                    height: "1.5",
                    flexShrink: "0",
                    borderRadius: "full",
                    bg: "primary",
                    boxShadow: "0 0 12px rgba(132, 204, 22, 0.8)",
                  })}
                />
                <div>
                  <h3 className={css({ fontSize: "sm", fontWeight: "semibold", color: "fg" })}>{item.title}</h3>
                  <p className={css({ mt: "1", fontSize: "sm", color: "fg.muted" })}>{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link className={cx(button({ variant: "secondary" }), css({ mt: "10" }))} href="/docs/api">
            Explore the API Reference
            <ArrowRightIcon />
          </Link>
        </div>

        <figure
          className={css({
            position: "relative",
            minWidth: "0",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "xl",
            bg: "surface",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 40px 120px -40px rgba(132, 204, 22, 0.25)",
          })}
        >
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
            <div aria-hidden="true" className={css({ display: "flex", gap: "1.5" })}>
              {[0, 1, 2].map((dot) => (
                <span
                  className={css({ width: "2.5", height: "2.5", borderRadius: "full", bg: "border.strong" })}
                  key={dot}
                />
              ))}
            </div>
            <figcaption
              className={css({
                fontFamily: "mono",
                fontSize: "xs",
                color: "fg",
                px: "2.5",
                py: "1",
                borderRadius: "sm",
                bg: "carbon",
              })}
            >
              emitter.ts
            </figcaption>
            <span className={css({ ml: "auto", fontFamily: "mono", fontSize: "2xs", color: "fg.subtle" })}>
              TypeScript
            </span>
          </div>

          <CodeLines code={source} lineNumbers />
        </figure>
      </div>
    </section>
  );
}
