import { css } from "styled-system/css";

const sections = [
  "Kinematic sampling",
  "Velocity smoothing",
  "Threshold gating",
  "Throttle strategy",
  "Tonnage mapping",
  "Odor selection",
  "Voice allocation",
  "Resonance shaping",
  "Envelope release",
  "Scheduling lead time",
  "Polyphony ceiling",
  "Deterministic replay",
  "Reduced motion policy",
  "Autoplay compliance",
  "Visibility gating",
  "Telemetry export",
];

/** Tall, neutral content for the playground's scroll container. */
export function ScrollSurfaceContent(): React.JSX.Element {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "3", p: "5" })}>
      <p className={css({ fontFamily: "mono", fontSize: "xs", color: "primary", mb: "2" })}>
        ↓ Scroll inside this panel. Slow and fast gestures produce different emissions.
      </p>
      {sections.map((title, index) => (
        <div
          className={css({
            p: "5",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "lg",
            bg: "carbon",
          })}
          key={title}
        >
          <span className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.subtle" })}>
            §{String(index + 1).padStart(2, "0")}
          </span>
          <h3 className={css({ mt: "1", fontSize: "md", fontWeight: "semibold", color: "fg" })}>{title}</h3>
          <p className={css({ mt: "2", fontSize: "sm", color: "fg.muted" })}>
            Calibration segment {index + 1} of {sections.length}. Each pixel scrolled here is sampled, smoothed and
            evaluated against the active acoustic profile.
          </p>
        </div>
      ))}
    </div>
  );
}
