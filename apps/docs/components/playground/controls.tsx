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
          px: "3",
          bg: "carbon",
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
