import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

type RouteContext = { params: { id: string } }

export async function POST(request: Request, { params }: RouteContext) {
    try {
        // ✅ params is not async
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing worker id" },
                { status: 400 }
            )
        }

        const backendUrl =
            process.env.BACKEND_URL?.replace(/\/$/, "") ||
            "https://easy-labour.onrender.com"

        // ✅ cookies() is synchronous
        const cookieStore = cookies()
        const cookieHeader = cookieStore
            .getAll()
            .map((c) => `${c.name}=${c.value}`)
            .join("; ")

        const res = await fetch(`${backendUrl}/api/admin/workers/${id}/expire`, {
            method: "POST",
            headers: {
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
                Accept: "application/json",
            },
            cache: "no-store",
        })

        // ✅ Handle JSON or non-JSON (or empty body) safely
        const contentType = res.headers.get("content-type") || ""
        let data: any = null

        if (contentType.includes("application/json")) {
            data = await res.json()
        } else {
            const text = await res.text()
            data = text ? { success: res.ok, message: text } : { success: res.ok }
        }

        return NextResponse.json(data, { status: res.status })
    } catch (error: any) {
        console.error("Worker expire proxy error:", error)

        const message =
            process.env.NODE_ENV === "development"
                ? error?.message || String(error)
                : "Internal server error"

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}
