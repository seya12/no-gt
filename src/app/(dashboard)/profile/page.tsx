import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Session } from "next-auth"

export default async function ProfilePage() {
  const session = (await getServerSession(authConfig)) as Session | null

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch user data from our database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      exercises: true,
      workoutPlans: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name || "Profile"}
              width={64}
              height={64}
              className="rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Your Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Exercises</p>
              <p className="text-2xl font-bold">{user.exercises.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Workout Plans</p>
              <p className="text-2xl font-bold">{user.workoutPlans.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 