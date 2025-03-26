"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Dumbbell, PlusCircle, User } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  
  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      active: pathname === "/"
    },
    {
      name: "Workouts",
      href: "/dashboard",
      icon: Dumbbell,
      active: pathname === "/dashboard" || pathname.startsWith("/workout")
    },
    {
      name: "New",
      href: "/workout/start",
      icon: PlusCircle,
      active: pathname === "/workout/start"
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile"
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className="grid h-full grid-cols-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-accent group",
              item.active && "text-primary"
            )}
          >
            <item.icon className={cn(
              "w-6 h-6 mb-1 group-hover:text-primary",
              item.active ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs group-hover:text-primary",
              item.active ? "text-primary" : "text-muted-foreground"
            )}>
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
} 