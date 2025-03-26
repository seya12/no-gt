import { getServerSession } from "next-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {session.user?.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user?.name || "Profile"} 
                  className="rounded-full h-16 w-16"
                />
              )}
              <div>
                <p className="font-medium">{session.user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{session.user?.email || "No email"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 