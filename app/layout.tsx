import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Lakbay Admin",
    template: "%s | Lakbay Admin",
  },
  description: "Content administration for Lakbay Travel and Tours.",
  // This is a private tool: never index any of it.
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfairDisplay.variable} ${inter.variable} antialiased`}>
        {/*
          The page tint goes on a wrapper, not <body>: globals.css sets
          `body { background: var(--bg-white) }` unlayered, and an unlayered rule
          beats Tailwind's layered utilities, so `bg-bg-light` on <body> is
          silently ignored.
        */}
        <div className="min-h-screen bg-bg-light">{children}</div>
      </body>
    </html>
  );
}
