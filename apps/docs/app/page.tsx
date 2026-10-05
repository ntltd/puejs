import { CodeShowcase } from "../components/landing/code-showcase";
import { Features } from "../components/landing/features";
import { Hero } from "../components/landing/hero";
import { LogoCloud } from "../components/landing/logo-cloud";
import { pageMetadata } from "../lib/site";

export const metadata = pageMetadata("/");

export default function Page(): React.JSX.Element {
  return (
    <main>
      <Hero />
      <LogoCloud />
      <Features />
      <CodeShowcase />
    </main>
  );
}
