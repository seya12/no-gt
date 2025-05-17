import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-day-picker/src/style.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNav } from "@/components/nav/main-nav";
import { BottomNav } from "@/components/nav/bottom-nav";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

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
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <header className="border-b hidden md:block w-full">
                <div className="flex h-14 items-center w-full">
                  <MainNav />
                </div>
              </header>
              <main className="flex-1">
                {children}
              </main>
              <BottomNav />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
