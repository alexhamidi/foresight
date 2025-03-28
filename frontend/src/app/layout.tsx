import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from '@/components/Header';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from '@vercel/analytics/react';
import { FeedbackButton } from '@/components/FeedbackButton';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Foresight",
  description: "Search the future",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans bg-white`}>
          <Header />
          {children}
          <FeedbackButton />
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
