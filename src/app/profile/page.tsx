import { getServerSession } from "next-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import Image from "next/image"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function ProfilePage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <LogoutButton />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {session.user?.image && (
                <div className="relative h-16 w-16 rounded-full overflow-hidden">
                  <Image 
                    src={session.user.image}
                    alt={session.user?.name || "Profile"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-medium">{session.user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{session.user?.email || "No email"}</p>
                <p className="text-xs text-muted-foreground">User ID: {session.user?.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 