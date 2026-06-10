import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopContactBar } from "@/components/TopContactBar";
import "../globals.css";
import BottomMarquee from "@/components/BottomMarquee";
import GoToTopButton from "@/components/GoToTopButton";
import LoadingBarProvider from "@/components/LoadingBar";

// next-intl imports
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CYC Nepal Laghubitta Bittiya Sanstha Ltd.",
  description: "Official website for CYC Nepal Laghubitta Bittiya Sanstha Ltd.",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const locales = ['en', 'ne'];
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider>
           <NextIntlClientProvider messages={messages}>
              <LoadingBarProvider>
                <TopContactBar />
                {children}
                <GoToTopButton />
                <BottomMarquee />
              </LoadingBarProvider>
            </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
