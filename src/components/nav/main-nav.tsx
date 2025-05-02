"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dumbbell, Home, User, LogOut } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const { status } = useSession()
  const isAuthenticated = status === "authenticated"

  return (
    <div className="relative flex w-full items-center px-6 sm:px-10 lg:px-16">
      <nav className="flex items-center space-x-4 lg:space-x-6">
        <Link
          href="/"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center",
            pathname === "/" ? "text-black dark:text-white" : "text-muted-foreground"
          )}
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </Link>
        
        {isAuthenticated && (
          <>
            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center",
                pathname === "/dashboard" || pathname.startsWith("/dashboard/") 
                  ? "text-black dark:text-white" 
                  : "text-muted-foreground"
              )}
            >
              <Dumbbell className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center",
                pathname === "/profile" || pathname.startsWith("/profile/")
                  ? "text-black dark:text-white" 
                  : "text-muted-foreground"
              )}
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Link>
          </>
        )}
      </nav>
      
      {isAuthenticated && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="absolute right-6 sm:right-10 lg:right-16"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sign out
        </Button>
      )}
    </div>
  )
} 