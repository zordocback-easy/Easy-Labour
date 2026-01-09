import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"

        // Forward cookies for authentication
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

        const res = await fetch(`${backendUrl}/api/admin/support-messages`, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
            },
            cache: "no-store",
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Proxy /api/admin/support-messages error:", error)
        return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
        const { id, status } = await req.json()

        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

        const res = await fetch(`${backendUrl}/api/admin/support-messages/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            body: JSON.stringify({ status })
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

        const res = await fetch(`${backendUrl}/api/admin/support-messages/${id}`, {
            method: "DELETE",
            headers: {
                Cookie: cookieHeader,
            }
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
    }
}

