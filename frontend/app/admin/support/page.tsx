
import { SupportMessagesList } from "@/components/support-messages-list"

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

export default async function AdminSupportPage() {
    const messages = await fetchSupportMessages()

    return (
        <div className="max-w-7xl mx-auto">
            <SupportMessagesList initialMessages={messages} />
        </div>
    )
}

