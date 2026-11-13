import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
