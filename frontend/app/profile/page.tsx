import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageBanner } from "@/components/page-banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserClientProfile } from "@/components/user-client-profile"
import Link from "next/link"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "client") {
    redirect("/login")
  }

  // Client data is included in the user object from getCurrentUser
  const client = user.client

  return (
    <>
      <Header />
      <PageBanner
        image="/user-profile-banner.jpg"
        title="My Profile"
        description="Manage your account and preferences"
        height="sm"
      />
      <main className="min-h-screen bg-muted/40 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <UserClientProfile client={client} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}

