import type { Metadata, Viewport } from "next";
import { Fira_Code, Inter } from "next/font/google";
import { Footer } from "../components/site/footer";
import { Navbar } from "../components/site/navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pue JS — Acoustic Scroll Events for the modern web",
    template: "%s — Pue JS",
  },
  description:
    "Next-generation acoustic feedback for modern web applications. Zero-dependency, strictly typed, purely organic scroll interactions.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
