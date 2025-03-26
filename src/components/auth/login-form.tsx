"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { useSearchParams } from "next/navigation"

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  return (
    <div className="grid gap-4">
      <Button
        variant="outline"
        onClick={() => signIn("github", { callbackUrl })}
      >
        <Github className="mr-2 h-4 w-4" />
        Sign in with GitHub
      </Button>
    </div>
  )
} 