import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { SessionProvider } from "@/components/SessionProvider";
import { Navigation } from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { E2ETestFeatures } from "@/components/E2ETestFeatures";
import { authOptions } from "@/lib/auth";
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
  title: "Pic Gallery",
  description: "A platform for sharing your artwork and creating beautiful galleries",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <SessionProvider session={session}>
          <Navigation />
          <Breadcrumbs items={[]}/>
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <E2ETestFeatures />
        </SessionProvider>
      </body>
    </html>
  );
}
