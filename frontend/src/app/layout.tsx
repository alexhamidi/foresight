import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header/Header";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import DynamicGrid from "@/components/background/DynamicGrid";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Foresight",
  description: "Stay ahead of the curve",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-stone-50 flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="fixed inset-0 w-full h-full z-0">
            <DynamicGrid />
          </div>

          <Header />
          {children}

          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
