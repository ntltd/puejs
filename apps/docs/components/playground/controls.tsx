import { css } from "styled-system/css";

export const fieldLabel = css({
  fontFamily: "mono",
  fontSize: "xs",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "fg.subtle",
});

const valueLabel = css({ fontFamily: "mono", fontSize: "xs", color: "fg" });

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

export function Slider({ label, value, min, max, step, format = String, onChange }: SliderProps): React.JSX.Element {
  return (
    <label className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
      <span className={css({ display: "flex", justifyContent: "space-between" })}>
        <span className={fieldLabel}>{label}</span>
        <span className={valueLabel}>{format(value)}</span>
      </span>
      <input
        className={css({ width: "100%", accentColor: "lime", cursor: "pointer" })}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
};

export function Select<T extends string>({ label, value, options, onChange }: SelectProps<T>): React.JSX.Element {
  return (
    <label className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
      <span className={fieldLabel}>{label}</span>
      <select
        className={css({
          height: "10",
          pl: "3",
          // Custom chevron: the native arrow ignores padding and sits against the border.
          pr: "10",
          appearance: "none",
          bg: "carbon",
          bgImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5l3 3 3-3' stroke='%23A3A3A3' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          bgRepeat: "no-repeat",
          bgPosition: "right 12px center",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "md",
          fontFamily: "mono",
          fontSize: "sm",
          color: "fg",
          cursor: "pointer",
          _focusVisible: { outline: "2px solid token(colors.primary)" },
        })}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
