import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { LoginForm } from "@/components/auth/login-form"

export default async function Home() {
  const session = await getServerSession()
  
  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to No-GT</h1>
      <p className="text-xl text-gray-600">Not only a Gym Tracker</p>
      <p className="mt-4 text-gray-500">Track your gym sessions, exercises, and progress</p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  )
}
