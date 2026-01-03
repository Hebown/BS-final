import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { themeScript } from "./theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chest",
  description: "AI-powered photo management.",
  keywords: ["photo", "gallery", "AI", "image"],
  icons: {
    icon: [
      { url: "/chest_front.png", sizes: "32x32", type: "image/png" },
      { url: "/chest_front.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/chest_front.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Chest",
    description: "AI-powered photo management.",
    type: "website",
    images: [
      {
        url: "/chest_front.png",
        width: 32,
        height: 32,
        alt: "Chest",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Chest",
    description: "AI-powered photo management.",
    images: ["/chest_front.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
