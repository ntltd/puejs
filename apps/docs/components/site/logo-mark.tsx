import Image from "next/image";
import { css } from "styled-system/css";

const LOGO_RATIO = 316 / 480;

/** The Pue JS mark, sized by its height. */
export function LogoMark({ height = 28, preload = false }: { height?: number; preload?: boolean }): React.JSX.Element {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={css({ flexShrink: "0" })}
      height={height}
      preload={preload}
      src="/logo.png"
      width={Math.round(height * LOGO_RATIO)}
    />
  );
}
