import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Login - No-GT",
  description: "Login to your account",
}

// This loading component will be shown while the LoginForm is loading
function LoginFormSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
} 