import { css, cva } from "styled-system/css";

const callout = cva({
  base: {
    my: "6",
    px: "5",
    py: "4",
    borderWidth: "1px",
    borderLeftWidth: "3px",
    borderRadius: "md",
    fontSize: "sm",
    color: "fg.muted",
    "& p": { my: "0" },
    "& p + p": { mt: "2" },
  },
  variants: {
    type: {
      note: { borderColor: "border", borderLeftColor: "primary", bg: "rgba(132, 204, 22, 0.04)" },
      warning: { borderColor: "border", borderLeftColor: "accent", bg: "rgba(234, 179, 8, 0.05)" },
    },
  },
  defaultVariants: { type: "note" },
});

type CalloutProps = {
  type?: "note" | "warning";
  title?: string;
  children: React.ReactNode;
};

export function Callout({ type = "note", title, children }: CalloutProps): React.JSX.Element {
  return (
    <aside className={callout({ type })}>
      {title ? (
        <p
          className={css({
            mb: "1.5",
            fontFamily: "mono",
            fontSize: "xs",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: type === "warning" ? "accent" : "primary",
          })}
        >
          {title}
        </p>
      ) : null}
      {children}
    </aside>
  );
}
