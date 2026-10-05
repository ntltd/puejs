import { ArticleLayout } from "../../../components/site/article-layout";

export default function RfcLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <ArticleLayout label="RFC 0001 · Draft">{children}</ArticleLayout>;
}
