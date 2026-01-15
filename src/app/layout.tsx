import "./global.css";
import { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";

const notoSans = Noto_Sans({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  weight: ["400", "600", "700"],
  subsets: ["devanagari"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remotion and Next.js",
  description: "Remotion and Next.js",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${notoSansDevanagari.variable}`}>
        {children}
      </body>
    </html>
  );
}
