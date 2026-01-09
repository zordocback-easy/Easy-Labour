
import { PaymentVerificationList } from "@/components/payment-verification-list"

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
        // Compatibility mapping
        return (data.workers || []).map((w: any) => ({
            ...w,
            id: w._id?.toString() || w.id,
            packagePurchasedAt: w.packagePurchasedAt
                ? typeof w.packagePurchasedAt === "string" ? new Date(w.packagePurchasedAt) : w.packagePurchasedAt
                : null,
        }))
    } catch (error) {
        return []
    }
}

export default async function AdminPaymentsPage() {
    const workers = await fetchPendingPaymentWorkers()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Payment Approvals</h2>
                <p className="text-muted-foreground">Verify and approve manual subscription payments.</p>
            </div>
            <PaymentVerificationList workers={workers} />
        </div>
    )
}
