
import { WorkersOverview } from "@/components/workers-overview"

async function fetchAllWorkers() {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
        const res = await fetch(`${backendUrl}/api/workers`, {
            method: "GET",
            cache: "no-store",
        })

        if (!res.ok) {
            return []
        }

        const data = await res.json()
        // Compatibility mapping
        return (data.workers || []).map((w: any) => ({
            ...w,
            id: w._id?.toString() || w.id,
            packageExpiry: w.packageExpiry ? (typeof w.packageExpiry === "string" ? new Date(w.packageExpiry) : w.packageExpiry) : null,
            packagePurchasedAt: w.packagePurchasedAt
                ? typeof w.packagePurchasedAt === "string" ? new Date(w.packagePurchasedAt) : w.packagePurchasedAt
                : null,
            verifiedAt: w.verifiedAt ? (typeof w.verifiedAt === "string" ? new Date(w.verifiedAt) : w.verifiedAt) : null,
            createdAt: w.createdAt ? (typeof w.createdAt === "string" ? new Date(w.createdAt) : w.createdAt) : null,
        }))
    } catch (error) {
        return []
    }
}

export default async function AdminWorkersPage() {
    const workers = await fetchAllWorkers()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Manage Workers</h2>
                <p className="text-muted-foreground">View, filter, and manage all service provider accounts.</p>
            </div>
            <WorkersOverview workers={workers} />
        </div>
    )
}
