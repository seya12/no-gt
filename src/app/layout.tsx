import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNav } from "@/components/nav/main-nav";
import { BottomNav } from "@/components/nav/bottom-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "No-GT: Not only a Gym Tracker",
  description: "Track your gym sessions, exercises, and progress",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b hidden md:block">
              <div className="container flex h-14 items-center">
                <MainNav />
              </div>
            </header>
            <main className="flex-1 pb-20 md:pb-4">
              {children}
            </main>
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
