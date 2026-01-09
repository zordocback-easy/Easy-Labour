import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageBanner } from "@/components/page-banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditClientProfileForm } from "@/components/edit-client-profile-form"

export default async function EditProfilePage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "client") {
    redirect("/login")
  }

  // Client data is included in the user object from getCurrentUser
  const client = user.client

  if (!client) {
    redirect("/profile")
  }

  return (
    <>
      <Header />
      <PageBanner
        image="/user-profile-banner.jpg"
        title="Edit Profile"
        description="Update your account information"
        height="sm"
      />
      <main className="min-h-screen bg-muted/40 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <EditClientProfileForm client={client} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}

