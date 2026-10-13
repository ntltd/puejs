import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Fira_Code, Inter } from "next/font/google";
import { Footer } from "../components/site/footer";
import { Navbar } from "../components/site/navbar";
import { pages, siteName, siteUrl } from "../lib/site";
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

// Google Tag Manager container, loaded in production builds only so local runs stay out of analytics.
const gtmId = process.env.NODE_ENV === "production" ? "GTM-T7CLPWGW" : undefined;

// Re-renders every page hourly, so the navbar's star count changes.
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: pages["/"].title,
    template: `%s — ${siteName}`,
  },
  description: pages["/"].description,
  applicationName: siteName,
  openGraph: { type: "website", siteName, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
