import type { Metadata } from "next";
import WayangLoader from '@/components/WayangLoader';
import { Suspense } from 'react';
import "./globals.css";

export const metadata: Metadata = {
  title: "Sinau Jawa — Media Pembelajaran Bahasa Jawa",
  description: "Prototype media pembelajaran digital interaktif Basa Jawa kanthi seneng. Nyawisake materi, dongeng rakyat Sawunggaling & Dewi Sangkrah, E-LKPD, kuis, lan krama alus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
          <WayangLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
