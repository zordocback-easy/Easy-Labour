import { redirect } from "next/navigation"
import { getAuthenticatedWorkerProfile } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth"
import { DashboardStats } from "@/components/dashboard-stats"
import { PackageCard } from "@/components/package-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { PageBanner } from "@/components/page-banner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AlertCircle, CheckCircle, Clock, User as UserIcon } from "lucide-react"

function isPackageExpired(worker: any): boolean {
  if (!worker.packageExpiry) return false
  const expiryDate = typeof worker.packageExpiry === 'string'
    ? new Date(worker.packageExpiry)
    : worker.packageExpiry
  return expiryDate < new Date()
}

function getDaysUntilExpiry(worker: any): number {
  if (!worker.packageExpiry) return 0
  const expiryDate = typeof worker.packageExpiry === 'string'
    ? new Date(worker.packageExpiry)
    : worker.packageExpiry
  const today = new Date()
  const diff = expiryDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function WorkerDashboard() {
  const user = await getCurrentUser()

  if (!user || user.role !== "worker") {
    redirect("/login")
  }

  const worker = await getAuthenticatedWorkerProfile()

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't load your worker profile. Please try again later.</p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const packageExpired = isPackageExpired(worker)
  const daysUntilExpiry = getDaysUntilExpiry(worker)

  // Determine profile image URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://easy-labour.onrender.com"
  const profileImageUrl = worker.profileImage
    ? (worker.profileImage.startsWith("http") ? worker.profileImage : `${backendUrl}/uploads/workers/${worker.profileImage}`)
    : ""

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <PageBanner
        image="/worker-dashboard-banner.jpg"
        title={`Welcome back, ${worker.name}`}
        description="Manage your profile, track analytics, and grow your business"
        height="md"
      />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">

            {/* Alerts Area */}
            <div className="space-y-4">
              {worker.verificationStatus === 'pending' && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="font-bold">Profile Verification Pending</AlertTitle>
                  <AlertDescription>
                    Our team is currently reviewing your identity documents. You'll be notified once your profile is verified.
                  </AlertDescription>
                </Alert>
              )}

              {worker.verificationStatus === 'rejected' && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Profile Verification Rejected</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    Your identity documents were rejected. Please update your profile with clear images.
                    <Button size="sm" variant="destructive" asChild className="ml-4 font-bold">
                      <Link href="/worker/edit-profile">Update Documents</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {worker.paymentStatus === 'pending' && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="font-bold">Payment Verification Pending</AlertTitle>
                  <AlertDescription>
                    We've received your payment proof for the <strong>{worker.packageType}</strong> package. It's under review.
                  </AlertDescription>
                </Alert>
              )}

              {worker.paymentStatus === 'rejected' && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Rejected</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    Your payment proof was rejected. Please check your transaction details and try again.
                    <Button size="sm" variant="destructive" asChild className="ml-4 font-bold">
                      <Link href="/packages">Resubmit Proof</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {packageExpired && worker.paymentStatus === 'verified' && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Package Expired</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    Your subscription has ended. Renew now to receive new leads.
                    <Button size="sm" variant="destructive" asChild className="ml-4 font-bold">
                      <Link href="/packages">Renew Now</Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Stats Overview */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Performance Overview
              </h2>
              <DashboardStats worker={worker} />
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h2 className="text-lg font-bold mb-4">Manage</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                <Link href="/worker/edit-profile" className="group">
                  <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <span className="font-semibold text-sm">Update Profile</span>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/packages" className="group">
                  <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="h-6 w-6" />
                      </div>
                      <span className="font-semibold text-sm">Membership</span>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/worker/verification" className="group">
                  <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <span className="font-semibold text-sm">Verification</span>
                    </CardContent>
                  </Card>
                </Link>

              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            <PackageCard worker={worker} />

            {/* Support Card */}
            <Card className="bg-slate-900 text-white border-none">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-slate-400 text-sm mb-4">Contact our support team for any issues regarding your account or bookings.</p>
                <Button variant="secondary" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
