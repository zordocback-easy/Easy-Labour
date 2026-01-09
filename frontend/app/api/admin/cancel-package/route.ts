import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET() {
    return NextResponse.json({ message: "Proxy is reachable" })
}

export async function POST(request: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
        const body = await request.text()

        // Forward cookies from the request
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

        console.log(`Proxying POST to: ${backendUrl}/api/admin/cancel-package`)
        const res = await fetch(`${backendUrl}/api/admin/cancel-package`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            body,
        })

        console.log(`Backend response status: ${res.status}`)
        const text = await res.text()
        console.log(`Backend response body: ${text}`)

        return new NextResponse(text, {
            status: res.status,
            headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
        })
    } catch (error) {
        return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
    }
}

