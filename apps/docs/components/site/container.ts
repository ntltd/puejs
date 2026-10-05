import { css } from "styled-system/css";

export const container = css({
  width: "100%",
  maxWidth: "1200px",
  mx: "auto",
  px: { base: "5", md: "8" },
});

export const eyebrow = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  fontFamily: "mono",
  fontSize: "xs",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "primary",
});

export const sectionTitle = css({
  mt: "4",
  fontSize: { base: "3xl", md: "4xl" },
  fontWeight: "semibold",
  letterSpacing: "-0.03em",
  lineHeight: "1.1",
  color: "fg",
  textWrap: "balance",
});

export const sectionLead = css({
  mt: "4",
  maxWidth: "560px",
  fontSize: { base: "md", md: "lg" },
  color: "fg.muted",
  textWrap: "pretty",
});
