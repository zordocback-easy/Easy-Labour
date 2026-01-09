import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
        const body = await request.json()

        const res = await fetch(`${backendUrl}/api/support`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (error) {
        console.error("Proxy /api/support error:", error)
        return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
    }
}

