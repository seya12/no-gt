"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-black dark:text-white" : "text-muted-foreground"
        )}
      >
        Home
      </Link>
      <Link
        href="/profile"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/profile" ? "text-black dark:text-white" : "text-muted-foreground"
        )}
      >
        Profile
      </Link>
    </nav>
  )
} 