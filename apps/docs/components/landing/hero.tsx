import Image from "next/image";
import Link from "next/link";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { container } from "../site/container";
import { GlyphFlat, GlyphSwirl } from "../site/glyphs";
import { InstallCommand } from "./install-command";
import { ArrowRightIcon } from "../site/icons";

export function Hero(): React.JSX.Element {
  return (
    <section
      className={css({
        position: "relative",
        overflow: "hidden",
        pt: { base: "16", md: "24" },
        pb: { base: "16", md: "24" },
      })}
    >
      {/* Toxic glow */}
      <div
        aria-hidden="true"
        className={css({
          position: "absolute",
          top: "-220px",
          left: "50%",
          width: "900px",
          height: "520px",
          transform: "translateX(-50%)",
          bgImage:
            "radial-gradient(closest-side, rgba(132,204,22,0.22), transparent), radial-gradient(closest-side at 70% 60%, rgba(234,179,8,0.14), transparent)",
          filter: "blur(40px)",
          pointerEvents: "none",
        })}
      />

      <div
        className={cx(
          container,
          css({
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }),
        )}
      >
        <div
          className={css({
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: "132px",
            height: "132px",
            mb: "10",
          })}
        >
          {/* Concentric emission field, centred on the mark */}
          <div
            aria-hidden="true"
            className={css({
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "1800px",
              height: "1800px",
              transform: "translate(-50%, -50%)",
              bgImage: "repeating-radial-gradient(circle, transparent 0 87px, rgba(248, 250, 252, 0.07) 87px 88px)",
              maskImage: "radial-gradient(circle, black 0%, rgba(0, 0, 0, 0.5) 30%, transparent 55%)",
              pointerEvents: "none",
            })}
          />
          {/* Sonar crosshair */}
          <div
            aria-hidden="true"
            className={css({
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "1400px",
              height: "1400px",
              transform: "translate(-50%, -50%)",
              bgImage:
                "linear-gradient(to right, transparent calc(50% - 0.5px), rgba(248, 250, 252, 0.06) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), linear-gradient(to bottom, transparent calc(50% - 0.5px), rgba(248, 250, 252, 0.06) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
              maskImage: "radial-gradient(circle, transparent 0 92px, black 120px, transparent 50%)",
              pointerEvents: "none",
            })}
          />
          {/* Rotating sweep */}
          <div
            aria-hidden="true"
            className={css({
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "1200px",
              height: "1200px",
              borderRadius: "full",
              bgImage:
                "conic-gradient(from 0deg, transparent 0deg 290deg, rgba(132, 204, 22, 0.04) 300deg, rgba(132, 204, 22, 0.2) 358deg, rgba(163, 230, 53, 0.55) 359.5deg, transparent 360deg)",
              maskImage:
                "radial-gradient(circle, transparent 0 92px, black 130px, rgba(0, 0, 0, 0.6) 35%, transparent 70%)",
              animation: "sweep 8s linear infinite",
              pointerEvents: "none",
              _motionReduce: { display: "none" },
            })}
          />
          {/* Contacts lit by the sweep: [angle in degrees, distance in px] */}
          {(
            [
              [68, 300],
              [112, 470],
              [248, 430],
              [302, 250],
            ] as const
          ).map(([angle, distance], index) => (
            <span
              aria-hidden="true"
              className={css({
                position: "absolute",
                display: "grid",
                placeItems: "center",
                width: "18px",
                height: "18px",
                ml: "-9px",
                mt: "-9px",
                color: "primary.hover",
                filter: "drop-shadow(0 0 6px rgba(132, 204, 22, 0.8))",
                opacity: "0",
                animation: "contact 8s linear infinite",
                pointerEvents: "none",
                _motionReduce: { display: "none" },
              })}
              key={angle}
              style={{
                left: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * distance}px)`,
                top: `calc(50% - ${Math.cos((angle * Math.PI) / 180) * distance}px)`,
                animationDelay: `${(angle / 360) * 8}s`,
              }}
            >
              {/* Every second pair is mirrored on the Y axis */}
              <span
                className={css({ display: "grid", "&[data-mirrored]": { transform: "scaleX(-1)" } })}
                data-mirrored={Math.floor(index / 2) % 2 === 1 ? "" : undefined}
              >
                {index % 2 === 0 ? <GlyphFlat /> : <GlyphSwirl />}
              </span>
            </span>
          ))}
          {["0s", "1.6s", "3.2s"].map((delay) => (
            <span
              aria-hidden="true"
              className={css({
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "176px",
                height: "176px",
                borderWidth: "1px",
                borderColor: "rgba(132, 204, 22, 0.4)",
                borderRadius: "full",
                opacity: "0",
                pointerEvents: "none",
                animation: "emission 4.8s cubic-bezier(0.2, 0.6, 0.3, 1) infinite",
                _motionReduce: { display: "none" },
              })}
              key={delay}
              style={{ animationDelay: delay }}
            />
          ))}
          <div
            aria-hidden="true"
            className={css({
              position: "absolute",
              inset: "-40px",
              borderRadius: "full",
              bgImage:
                "radial-gradient(closest-side, rgba(132, 204, 22, 0.35), rgba(234, 179, 8, 0.08) 60%, transparent)",
              filter: "blur(20px)",
              pointerEvents: "none",
            })}
          />
          <Image
            alt="Pue JS"
            className={css({
              position: "relative",
              filter: "drop-shadow(0 12px 32px rgba(132, 204, 22, 0.35))",
              animation: "float 6s ease-in-out infinite",
              _motionReduce: { animation: "none" },
            })}
            height={132}
            preload
            src="/logo.png"
            width={87}
          />
        </div>

        <Link
          className={css({
            display: "inline-flex",
            alignItems: "center",
            gap: "2.5",
            pl: "2",
            pr: "3",
            py: "1",
            borderWidth: "1px",
            borderColor: "rgba(132, 204, 22, 0.35)",
            borderRadius: "full",
            bg: "rgba(132, 204, 22, 0.06)",
            fontFamily: "mono",
            fontSize: "xs",
            color: "fg.muted",
            transition: "border-color 160ms ease, color 160ms ease",
            _hover: { borderColor: "primary", color: "fg" },
          })}
          href="/docs"
        >
          <span
            className={css({
              px: "1.5",
              py: "0.5",
              borderRadius: "full",
              bg: "primary",
              color: "carbon",
              fontWeight: "semibold",
            })}
          >
            v1.0 is out
          </span>
          Gaseous Rendering Engine
          <ArrowRightIcon size={12} />
        </Link>

        <h1
          className={css({
            mt: "8",
            maxWidth: "980px",
            fontSize: { base: "4xl", sm: "5xl", lg: "7xl" },
            fontWeight: "bold",
            letterSpacing: "-0.045em",
            lineHeight: "1.02",
            textWrap: "balance",
            textGradient: "toxic",
          })}
        >
          Next-generation acoustic feedback for modern web applications.
        </h1>

        <p
          className={css({
            mt: "6",
            maxWidth: "600px",
            fontSize: { base: "lg", md: "xl" },
            color: "fg.muted",
            textWrap: "balance",
          })}
        >
          Zero-dependency, strictly typed, purely organic scroll interactions.
        </p>

        <div
          className={css({
            mt: "10",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "3",
          })}
        >
          <Link className={button({ variant: "primary" })} href="/docs/quick-start">
            Get Started
            <ArrowRightIcon />
          </Link>
          <Link className={button({ variant: "secondary" })} href="/manifesto">
            Read the Manifesto
          </Link>
        </div>

        <div className={css({ mt: "10", width: "100%", display: "flex", justifyContent: "center" })}>
          <InstallCommand />
        </div>

        <dl
          className={css({
            mt: "12",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { base: "6", md: "10" },
            fontFamily: "mono",
            fontSize: "xs",
            color: "fg.subtle",
            "& div": { display: "flex", gap: "2" },
            "& dd": { color: "fg" },
          })}
        >
          <div>
            <dt>bundle</dt>
            <dd>1.4 kB gzip</dd>
          </div>
          <div>
            <dt>latency p99</dt>
            <dd>1.8 ms</dd>
          </div>
          <div>
            <dt>dependencies</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>license</dt>
            <dd>Unlicense</dd>
          </div>
        </dl>
      </div>
      {/* Film grain, matching the texture of the mark */}
      <div
        aria-hidden="true"
        className={css({
          position: "absolute",
          inset: "0",
          bgImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -0.45'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          opacity: "0.16",
          mixBlendMode: "overlay",
          pointerEvents: "none",
        })}
      />
    </section>
  );
}
