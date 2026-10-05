import { css, cx } from "styled-system/css";
import { container, eyebrow, sectionLead, sectionTitle } from "../site/container";

const card = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  p: { base: "6", md: "8" },
  bg: "surface",
  borderWidth: "1px",
  borderColor: "border",
  borderRadius: "xl",
  transition: "border-color 200ms ease",
  _hover: { borderColor: "border.strong" },
  _before: {
    content: '""',
    position: "absolute",
    inset: "0 0 auto 0",
    height: "1px",
    bgImage: "linear-gradient(90deg, transparent, rgba(132,204,22,0.5), transparent)",
    opacity: "0",
    transition: "opacity 200ms ease",
  },
  "&:hover::before": { opacity: "1" },
});

const cardLabel = css({ fontFamily: "mono", fontSize: "xs", color: "fg.subtle" });

const cardTitle = css({
  mt: "3",
  fontSize: "xl",
  fontWeight: "semibold",
  letterSpacing: "-0.02em",
  color: "fg",
});

const cardBody = css({ mt: "2", fontSize: "sm", color: "fg.muted", maxWidth: "440px" });

const visual = css({
  mt: "auto",
  pt: "8",
  fontFamily: "mono",
  fontSize: "xs",
});

function LatencyVisual(): React.JSX.Element {
  // Illustrative relative intensity of the last 32 emissions.
  const samples = [
    0.9, 1.1, 0.8, 1.2, 0.9, 1.0, 1.4, 0.8, 0.9, 1.1, 1.0, 0.7, 1.3, 0.9, 1.0, 1.8, 0.9, 0.8, 1.1, 1.0, 0.9, 1.2, 0.8,
    1.0, 0.9, 1.1, 1.5, 0.9, 0.8, 1.0, 1.1, 0.9,
  ];
  return (
    <div className={visual}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          color: "fg.subtle",
          mb: "3",
          gap: "4",
          "& > span": { whiteSpace: "nowrap" },
        })}
      >
        <span>emission timeline · last 32 events</span>
        <span className={css({ color: "primary" })}>lead time 5 ms</span>
      </div>
      <div
        className={css({
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: "1",
          height: "28",
          px: "3",
          pt: "3",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "lg",
          bg: "carbon",
        })}
      >
        <div
          aria-hidden="true"
          className={css({
            position: "absolute",
            left: "0",
            right: "0",
            top: "3",
            borderTop: "1px dashed rgba(234, 179, 8, 0.45)",
          })}
        />
        {samples.map((value, index) => (
          <span
            className={css({
              flex: "1",
              borderTopRadius: "2px",
              bgImage: "linear-gradient(to top, rgba(132,204,22,0.25), #84CC16)",
            })}
            key={index}
            style={{ height: `${(value / 2) * 100}%` }}
          />
        ))}
      </div>
      <div
        className={css({
          mt: "4",
          display: "flex",
          gap: "6",
          color: "fg.subtle",
          flexWrap: "wrap",
          rowGap: "2",
          "& > span": { whiteSpace: "nowrap" },
        })}
      >
        <span>
          detection <span className={css({ color: "fg" })}>same frame</span>
        </span>
        <span>
          scheduling <span className={css({ color: "fg" })}>{"< 1 ms"}</span>
        </span>
        <span>
          clock <span className={css({ color: "fg" })}>Web Audio</span>
        </span>
      </div>
    </div>
  );
}

function TonnageVisual(): React.JSX.Element {
  const rows = [
    { velocity: "120 px/s", gain: 18 },
    { velocity: "640 px/s", gain: 46 },
    { velocity: "1.8k px/s", gain: 74 },
    { velocity: "4.2k px/s", gain: 100 },
  ];
  return (
    <ul className={cx(visual, css({ display: "flex", flexDirection: "column", gap: "3" }))}>
      {rows.map((row) => (
        <li
          className={css({ display: "grid", gridTemplateColumns: "72px 1fr 36px", alignItems: "center", gap: "3" })}
          key={row.velocity}
        >
          <span className={css({ color: "fg.subtle" })}>{row.velocity}</span>
          <span className={css({ height: "1.5", borderRadius: "full", bg: "carbon", overflow: "hidden" })}>
            <span
              className={css({ display: "block", height: "100%", borderRadius: "full", bgGradient: "toxic" })}
              style={{ width: `${row.gain}%` }}
            />
          </span>
          <span className={css({ color: "fg", textAlign: "right" })}>{row.gain}%</span>
        </li>
      ))}
    </ul>
  );
}

function TreeShakingVisual(): React.JSX.Element {
  const modules = [
    { name: "odors/staccato", size: "2.1 kB", kept: true },
    { name: "odors/sustained", size: "1.7 kB", kept: true },
    { name: "odors/soprano", size: "2.3 kB", kept: false },
    { name: "odors/sforzando", size: "4.9 kB", kept: false },
    { name: "odors/cathedral", size: "9.3 kB", kept: false },
  ];
  return (
    <ul
      className={cx(
        visual,
        css({ borderWidth: "1px", borderColor: "border", borderRadius: "lg", bg: "carbon", overflow: "hidden" }),
      )}
    >
      {modules.map((module) => (
        <li
          className={css({
            display: "flex",
            justifyContent: "space-between",
            px: "3",
            py: "2",
            borderBottomWidth: "1px",
            borderColor: "border",
            _last: { borderBottomWidth: "0" },
          })}
          key={module.name}
        >
          <span
            className={css({
              color: module.kept ? "fg" : "fg.subtle",
              textDecoration: module.kept ? "none" : "line-through",
            })}
          >
            {module.name}
          </span>
          <span className={css({ color: module.kept ? "primary" : "fg.subtle" })}>
            {module.kept ? module.size : "eliminated"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DeterminismVisual(): React.JSX.Element {
  const runs = ["run #1", "run #2"];
  const sequence = ["0.91", "1.07", "0.96", "1.02", "0.94"];
  return (
    <div className={cx(visual, css({ display: "grid", gap: "2" }))}>
      {runs.map((run) => (
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            p: "3",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "lg",
            bg: "carbon",
          })}
          key={run}
        >
          <span className={css({ width: "14", color: "fg.subtle" })}>{run}</span>
          {sequence.map((pitch, index) => (
            <span className={css({ color: "primary" })} key={index}>
              {pitch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Features(): React.JSX.Element {
  return (
    <section className={css({ py: { base: "20", md: "28" } })}>
      <div className={container}>
        <span className={eyebrow}>01 — Capabilities</span>
        <h2 className={sectionTitle}>Engineered for production-grade emissions.</h2>
        <p className={sectionLead}>
          Every layer of the Pue JS runtime has been profiled, benchmarked and hardened to deliver deterministic
          acoustic output at any scroll velocity.
        </p>

        <div
          className={css({
            mt: "14",
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: "repeat(3, 1fr)" },
            gap: "4",
          })}
        >
          <article className={cx(card, css({ gridColumn: { lg: "span 2" } }))}>
            <span className={cardLabel}>latency</span>
            <h3 className={cardTitle}>Low-Latency Emission</h3>
            <p className={cardBody}>
              Motion is detected and the emission scheduled within the same animation frame. Passive listeners and
              frame-aligned sampling keep your INP untouched.
            </p>
            <LatencyVisual />
          </article>

          <article className={card}>
            <span className={cardLabel}>gain</span>
            <h3 className={cardTitle}>Dynamic Tonnage Calculation</h3>
            <p className={cardBody}>
              Volume scales continuously with scroll velocity through a calibrated tonnage curve. Measured reading stays
              discreet; aggressive flicks are rendered at full amplitude.
            </p>
            <TonnageVisual />
          </article>

          <article className={card}>
            <span className={cardLabel}>bundle</span>
            <h3 className={cardTitle}>Tree-shakable Odors</h3>
            <p className={cardBody}>
              Each acoustic profile ships as an isolated ES module. Import only the emissions you need — everything else
              is eliminated at build time.
            </p>
            <TreeShakingVisual />
          </article>

          <article className={cx(card, css({ gridColumn: { lg: "span 2" } }))}>
            <span className={cardLabel}>determinism</span>
            <h3 className={cardTitle}>Deterministic Emissions</h3>
            <p className={cardBody}>
              Pitch variation and odor selection are drawn from a seeded generator. Identical scroll input produces
              identical acoustic output, so your acoustic layer can be snapshot-tested.
            </p>
            <DeterminismVisual />
          </article>
        </div>
      </div>
    </section>
  );
}
