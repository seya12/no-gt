import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNav } from "@/components/nav/main-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "No-GT: Not only a Gym Tracker",
  description: "Track your gym sessions, exercises, and progress",
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
          <header className="border-b">
            <div className="container flex h-16 items-center px-4">
              <MainNav />
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
