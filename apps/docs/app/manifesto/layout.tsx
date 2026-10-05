import { ArticleLayout } from "../../components/site/article-layout";

export default function ManifestoLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ArticleLayout label="Manifesto" lead>
      {children}
    </ArticleLayout>
  );
}
