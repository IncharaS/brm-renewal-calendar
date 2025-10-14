import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/Providers";
import { Toaster } from 'react-hot-toast';

import { Geist } from "next/font/google";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BRM-Calender",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignInUrl='/' >
      <Providers>
        <html lang="en">
          <body
            className={`${geistSans.variable} ${playfair.variable} antialiased w-screen min-h-screen bg-gradient-to-r via-cyan-100  from-indigo-100 to-lime-100 `}
          >
            {children}
            <Toaster />
            <div className="fixed bottom-2 w-full text-center text-xs text-gray-800 z-50">
              INCHARA SRINIVASA
            </div>
          </body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}
