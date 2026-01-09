import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET(request: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"

        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

        const res = await fetch(`${backendUrl}/api/admin/client-count`, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
            },
            cache: "no-store",
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Client count proxy error:", error)
        return NextResponse.json({ success: false, count: 0 }, { status: 500 })
    }
}

