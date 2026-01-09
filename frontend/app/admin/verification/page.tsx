
import { VerificationList } from "@/components/verification-list"

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
        // Compatibility mapping
        return (data.workers || []).map((w: any) => ({
            ...w,
            id: w._id?.toString() || w.id,
        }))
    } catch (error) {
        return []
    }
}

export default async function AdminVerificationPage() {
    const workers = await fetchUnverifiedWorkers()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Worker Verification</h2>
                <p className="text-muted-foreground">Review and approve new worker profiles.</p>
            </div>
            <VerificationList workers={workers} />
        </div>
    )
}
