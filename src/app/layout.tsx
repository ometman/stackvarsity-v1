import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mystackvarsity.com"),
  title: {
    default: "Stack Varsity | Build • Educate • Innovate",
    template: "%s | Stack Varsity",
  },
  description:
    "Stack Varsity is a digital skills education and professional IT certification examination preparation platform.",
  publisher: "Stack Varsity",
  authors: [{ name: "Stack Varsity", url: "https://www.mystackvarsity.com" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Stack Varsity",
    title: "Stack Varsity | Build • Educate • Innovate",
    description:
      "Practical digital skills education and independent professional IT certification exam preparation.",
    url: "https://www.mystackvarsity.com",
  },
  twitter: {
    card: "summary",
    title: "Stack Varsity | Build • Educate • Innovate",
    description:
      "Practical digital skills education and independent professional IT certification exam preparation.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <Suspense fallback={<div className="h-14 border-b border-border bg-background" />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
