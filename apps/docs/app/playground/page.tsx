import { css, cx } from "styled-system/css";
import { Playground } from "../../components/playground/playground";
import { container, eyebrow, sectionLead } from "../../components/site/container";
import { pageMetadata } from "../../lib/site";

export const metadata = pageMetadata("/playground");

export default function PlaygroundPage(): React.JSX.Element {
  return (
    <main className={cx(container, css({ pt: { base: "10", md: "16" }, pb: "24" }))}>
      <span className={eyebrow}>Playground</span>
      <h1
        className={css({
          mt: "4",
          fontSize: { base: "3xl", md: "4xl" },
          fontWeight: "bold",
          letterSpacing: "-0.035em",
          lineHeight: "1.1",
        })}
      >
        Acoustic Playground
      </h1>
      <p className={sectionLead}>
        Enable audio, scroll the test surface and tune every parameter in real time. The generated code reproduces your
        configuration exactly.
      </p>
      <div className={css({ mt: "10" })}>
        <Playground />
      </div>
    </main>
  );
}
