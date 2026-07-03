// src/app/layout.tsx — COMPLETE FILE, replace entirely

import type { Metadata } from "next";
import { Geist, Work_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chakshu Mitra — AI Eye Screening",
  description:
    "Describe symptoms, upload an image, or run a live scan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${workSans.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased font-body">
        {children}
      </body>
    </html>
  );
}