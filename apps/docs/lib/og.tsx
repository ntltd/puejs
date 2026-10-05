import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { pages, type PageInfo, type PagePath } from "./site";

export const ogSize = { width: 1200, height: 630 };

const colors = {
  carbon: "#0A0A0A",
  lime: "#84CC16",
  sulfur: "#EAB308",
  offwhite: "#F8FAFC",
  muted: "#A3A3A3",
  subtle: "#737373",
  border: "#262626",
};

// Fonts are vendored (SIL Open Font License) because Satori cannot read WOFF2.
const fontFile = (file: string): Promise<Buffer> => readFile(join(process.cwd(), "assets", "fonts", file));

async function loadAssets() {
  const [inter400, inter600, inter700, fira400, logo] = await Promise.all([
    fontFile("inter-latin-400-normal.woff"),
    fontFile("inter-latin-600-normal.woff"),
    fontFile("inter-latin-700-normal.woff"),
    fontFile("fira-code-latin-400-normal.woff"),
    readFile(join(process.cwd(), "public", "logo.png")),
  ]);
  return {
    logo: `data:image/png;base64,${logo.toString("base64")}`,
    fonts: [
      { name: "Inter", data: inter400, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: inter600, weight: 600 as const, style: "normal" as const },
      { name: "Inter", data: inter700, weight: 700 as const, style: "normal" as const },
      { name: "Fira Code", data: fira400, weight: 400 as const, style: "normal" as const },
    ],
  };
}

/** Renders the social card of a page: sonar rings around the mark, headline on the left. */
export async function renderOgImage(path: PagePath): Promise<ImageResponse> {
  const page: PageInfo = pages[path];
  const headline = page.headline ?? page.title;
  const { logo, fonts } = await loadAssets();

  // Sonar centre, partially off-canvas on the right.
  const centerX = 960;
  const centerY = 315;
  const rings = [140, 230, 320, 410, 500, 590];

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: colors.carbon,
        fontFamily: "Inter",
        color: colors.offwhite,
        overflow: "hidden",
      }}
    >
      {/* Glow behind the mark */}
      <div
        style={{
          position: "absolute",
          left: centerX - 300,
          top: centerY - 300,
          width: 600,
          height: 600,
          // closest-side keeps the gradient transparent at the box edges: Satori does not clip to border-radius
          backgroundImage:
            "radial-gradient(circle closest-side, rgba(132, 204, 22, 0.3) 0%, rgba(234, 179, 8, 0.08) 55%, rgba(10, 10, 10, 0) 100%)",
        }}
      />
      {/* Concentric emission rings */}
      {rings.map((radius, index) => (
        <div
          key={radius}
          style={{
            position: "absolute",
            left: centerX - radius,
            top: centerY - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: 9999,
            border: `${index === 1 ? 2 : 1}px solid ${
              index === 1 ? "rgba(132, 204, 22, 0.45)" : `rgba(248, 250, 252, ${0.1 - index * 0.012})`
            }`,
          }}
        />
      ))}
      {/* Crosshair */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: 0,
          width: 1,
          height: "100%",
          backgroundImage:
            "linear-gradient(to bottom, rgba(248,250,252,0), rgba(248,250,252,0.08), rgba(248,250,252,0))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 520,
          top: centerY,
          width: 680,
          height: 1,
          backgroundImage:
            "linear-gradient(to right, rgba(248,250,252,0), rgba(248,250,252,0.08), rgba(248,250,252,0))",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img
        alt=""
        height={200}
        src={logo}
        style={{ position: "absolute", left: centerX - 66, top: centerY - 100 }}
        width={132}
      />

      {/* Text column */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 700,
          height: "100%",
          padding: "64px 0 64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
          <img alt="" height={40} src={logo} width={26} />
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>Pue JS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Fira Code",
              fontSize: 22,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.lime,
            }}
          >
            {page.label}
          </span>
          <span
            style={{
              marginTop: 20,
              fontSize: headline.length > 50 ? 52 : headline.length > 30 ? 62 : 72,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              backgroundImage: `linear-gradient(90deg, ${colors.lime}, ${colors.sulfur})`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {headline}
          </span>
          <span style={{ marginTop: 24, fontSize: 26, lineHeight: 1.45, color: colors.muted }}>{page.description}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 14,
            padding: "12px 20px",
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            backgroundColor: "#171717",
            fontFamily: "Fira Code",
            fontSize: 22,
          }}
        >
          <span style={{ color: colors.lime }}>$</span>
          <span>npm install puejs</span>
        </div>
      </div>
    </div>,
    { ...ogSize, fonts },
  );
}
