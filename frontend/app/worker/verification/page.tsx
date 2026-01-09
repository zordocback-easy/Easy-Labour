import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { VerificationUpload } from "@/components/verification-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

async function getWorkerProfile() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    // First get current user to get profileId
    const userRes = await fetch(`${backendUrl}/api/current-user`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    const userData = await userRes.json()

    if (!userData.user || userData.user.role !== "worker" || !userData.user.profileId) {
      return null
    }

    // Fetch worker profile by ID
    const workerRes = await fetch(`${backendUrl}/api/workers/${userData.user.profileId}`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    if (!workerRes.ok) {
      return null
    }

    const workerData = await workerRes.json()
    const worker = workerData.worker || null

    // Convert MongoDB _id to id for compatibility
    if (worker && worker._id) {
      worker.id = worker._id.toString()
    }

    return worker
  } catch (error) {
    console.error("Failed to fetch worker profile:", error)
    return null
  }
}

export default async function VerificationPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "worker") {
    redirect("/login")
  }

  // Fetch worker profile from backend
  const worker = await getWorkerProfile()

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Worker Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">Your worker profile could not be loaded. Please contact support.</p>
          <Button asChild>
            <Link href="/worker/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-muted/40 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/worker/dashboard">
          <Button variant="default" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Verification Documents</CardTitle>
            <CardDescription>Upload your CNIC to get verified and gain client trust</CardDescription>
          </CardHeader>
          <CardContent>
            {worker.verificationStatus === "rejected" && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-semibold">Verification Rejected</AlertTitle>
                <AlertDescription className="mt-2">
                  Your verification documents were rejected by our admin team. Please review your documents and
                  re-submit with the correct information. Common reasons for rejection include unclear images, expired
                  CNIC, or mismatched information.
                </AlertDescription>
              </Alert>
            )}

            {worker.verificationStatus === "pending" && (
              <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-900 font-semibold">Verification Pending</AlertTitle>
                <AlertDescription className="text-yellow-800 mt-2">
                  Your profile is currently under review by our admin team. This usually takes 24-48 hours. Once
                  verified, you can purchase a package to make your profile visible to customers.
                </AlertDescription>
              </Alert>
            )}

            {worker.verificationStatus === "verified" && worker.isVerified ? (
              <div className="text-center py-8">
                <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-green-700">You're Verified!</h3>
                <p className="text-muted-foreground mb-6">
                  Your profile has been verified by our admin team. You can now purchase a package to start receiving
                  customer inquiries.
                </p>
                <Link href="/packages">
                  <Button className="bg-green-600 hover:bg-green-700">View Packages</Button>
                </Link>
              </div>
            ) : (
              <VerificationUpload workerId={worker.id} cnicNumber={worker.cnicNumber} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

