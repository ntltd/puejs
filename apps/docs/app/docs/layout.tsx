import { css, cx } from "styled-system/css";
import { Pager } from "../../components/docs/pager";
import { Sidebar } from "../../components/docs/sidebar";
import { container } from "../../components/site/container";

export default function DocsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div
      className={cx(
        container,
        css({
          display: "grid",
          gridTemplateColumns: { base: "minmax(0, 1fr)", lg: "240px minmax(0, 1fr)" },
          gap: { lg: "12" },
        }),
      )}
    >
      <Sidebar />
      <main className={css({ minWidth: "0", maxWidth: "760px", pt: { base: "8", lg: "12" }, pb: "24" })}>
        <article>{children}</article>
        <Pager />
      </main>
    </div>
  );
}
