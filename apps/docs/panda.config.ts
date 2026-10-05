import { defineConfig, defineRecipe } from "@pandacss/dev";

const button = defineRecipe({
  className: "button",
  description: "Call-to-action button",
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    height: "11",
    px: "5",
    borderRadius: "md",
    fontSize: "sm",
    fontWeight: "semibold",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "background 160ms ease, box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease",
    _focusVisible: {
      outline: "2px solid token(colors.primary)",
      outlineOffset: "2px",
    },
    _active: { transform: "translateY(1px)" },
  },
  variants: {
    variant: {
      primary: {
        bg: "primary",
        color: "carbon",
        boxShadow: "glow",
        _hover: { bg: "primary.hover", boxShadow: "glowStrong" },
      },
      secondary: {
        bg: "surface",
        color: "fg",
        borderWidth: "1px",
        borderColor: "border",
        _hover: { bg: "surface.hover", borderColor: "border.strong" },
      },
      ghost: {
        height: "9",
        px: "3",
        color: "fg.muted",
        borderWidth: "1px",
        borderColor: "border",
        fontWeight: "medium",
        _hover: { color: "fg", borderColor: "border.strong" },
      },
    },
  },
  defaultVariants: { variant: "primary" },
});

export default defineConfig({
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  preflight: true,
  include: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./mdx-components.tsx"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",

  globalCss: {
    html: {
      colorScheme: "dark",
      scrollBehavior: "smooth",
      WebkitFontSmoothing: "antialiased",
    },
    body: {
      bg: "carbon",
      color: "fg",
      fontFamily: "sans",
      lineHeight: "1.6",
      overflowX: "hidden",
    },
    "::selection": {
      bg: "primary",
      color: "carbon",
    },
  },

  theme: {
    extend: {
      tokens: {
        colors: {
          carbon: { value: "#0A0A0A" },
          anthracite: { value: "#171717" },
          lime: { value: "#84CC16" },
          sulfur: { value: "#EAB308" },
          offwhite: { value: "#F8FAFC" },
        },
        fonts: {
          sans: { value: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" },
          mono: { value: "var(--font-fira-code), ui-monospace, SFMono-Regular, Menlo, monospace" },
        },
        gradients: {
          toxic: { value: "linear-gradient(90deg, #84CC16 0%, #EAB308 100%)" },
        },
        shadows: {
          glow: {
            value: "0 0 0 1px rgba(132, 204, 22, 0.4), 0 0 24px -4px rgba(132, 204, 22, 0.55)",
          },
          glowStrong: {
            value: "0 0 0 1px rgba(132, 204, 22, 0.6), 0 0 40px -4px rgba(132, 204, 22, 0.75)",
          },
        },
      },
      semanticTokens: {
        colors: {
          fg: {
            DEFAULT: { value: "{colors.offwhite}" },
            muted: { value: "#A3A3A3" },
            subtle: { value: "#737373" },
          },
          surface: {
            DEFAULT: { value: "{colors.anthracite}" },
            hover: { value: "#1F1F1F" },
          },
          border: {
            DEFAULT: { value: "#262626" },
            strong: { value: "#3F3F46" },
          },
          primary: {
            DEFAULT: { value: "{colors.lime}" },
            hover: { value: "#A3E635" },
          },
          accent: { value: "{colors.sulfur}" },
        },
      },
      keyframes: {
        emission: {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.6)" },
          "15%": { opacity: "1" },
          "70%": { opacity: "0" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(3.5)" },
        },
        sweep: {
          from: { transform: "translate(-50%, -50%) rotate(0deg)" },
          to: { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        contact: {
          "0%": { opacity: "1", transform: "scale(1.4)" },
          "4%": { opacity: "1", transform: "scale(1)" },
          "45%": { opacity: "0" },
          "100%": { opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
      recipes: { button },
    },
  },
});
