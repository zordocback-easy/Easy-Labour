
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserCheck, UserX, TrendingUp, MessageSquare, ArrowUpRight, Activity } from "lucide-react"
import { cn } from "@/lib/utils"


async function fetchUnverifiedWorkers() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/admin/unverified-workers`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.workers || []
  } catch (error) {
    return []
  }
}

async function fetchPendingPaymentWorkers() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/admin/payments-pending`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.workers || []
  } catch (error) {
    return []
  }
}

async function fetchAllWorkers() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const res = await fetch(`${backendUrl}/api/workers`, {
      method: "GET",
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.workers || []
  } catch (error) {
    return []
  }
}

async function fetchClientCount() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/admin/client-count`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.count || 0
  } catch (error) {
    return 0
  }
}

async function fetchSupportMessages() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/admin/support-messages`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.messages || []
  } catch (error) {
    return []
  }
}

export default async function AdminDashboard() {
  const [unverifiedWorkers, pendingPaymentWorkers, allWorkers, clientCount, supportMessages] = await Promise.all([
    fetchUnverifiedWorkers(),
    fetchPendingPaymentWorkers(),
    fetchAllWorkers(),
    fetchClientCount(),
    fetchSupportMessages(),
  ])

  const verifiedWorkers = allWorkers.filter((w: any) => w.isVerified)

  const stats = [
    {
      title: "Total Clients",
      value: clientCount,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      change: "+12% from last month"
    },
    {
      title: "Verified Workers",
      value: verifiedWorkers.length,
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
      change: "+4 new this week"
    },
    {
      title: "Pending Verification",
      value: unverifiedWorkers.length,
      icon: UserX,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      change: "Action required"
    },
    {
      title: "Payment Approvals",
      value: pendingPaymentWorkers.length,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      change: "Check payments"
    },
    {
      title: "Support Inquiries",
      value: supportMessages.length,
      icon: MessageSquare,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      change: "Avg response 2h"
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening on your platform today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-4 opacity-10 ${stat.color}`}>
                <Icon className="h-24 w-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.title === "Pending Verification" || stat.title === "Payment Approvals" ? (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {stat.change}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" /> {stat.change}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1 border-none shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest registrations and updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {allWorkers.slice(0, 5).map((worker: any, idx: number) => (
                <div key={worker._id || idx} className="flex items-center">
                  <div className={cn(
                    "mr-4 rounded-full p-2",
                    worker.isVerified ? "bg-green-100" : "bg-blue-100"
                  )}>
                    {worker.isVerified ? (
                      <UserCheck className={cn("h-4 w-4", worker.isVerified ? "text-green-600" : "text-blue-600")} />
                    ) : (
                      <Users className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {worker.isVerified ? "Worker Verified" : "New Registration"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {worker.name} ({worker.category})
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap">
                    {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              ))}
              {allWorkers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent activity to show.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-none shadow-md bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-primary-foreground/80">Manage your platform efficiently.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <a href="/admin/verification" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/10">
                <UserCheck className="h-8 w-8" />
                <span className="font-semibold text-sm">Verify Workers</span>
              </a>
              <a href="/admin/payments" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/10">
                <TrendingUp className="h-8 w-8" />
                <span className="font-semibold text-sm">Approve Payments</span>
              </a>
              <a href="/admin/workers" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/10">
                <Users className="h-8 w-8" />
                <span className="font-semibold text-sm">Manage Users</span>
              </a>
              <a href="/admin/support" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer border border-white/10">
                <MessageSquare className="h-8 w-8" />
                <span className="font-semibold text-sm">Support Inbox</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
