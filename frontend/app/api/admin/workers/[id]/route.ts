import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

type RouteContext = { params: { id: string } }
type CookieLike = { name: string; value: string }

export async function DELETE(_request: Request, { params }: RouteContext) {
    try {
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

        // ✅ In your setup, cookies() is typed async
        const cookieStore = await cookies()
        const cookieHeader = cookieStore
            .getAll()
            .map((c: CookieLike) => `${c.name}=${c.value}`)
            .join("; ")

        const res = await fetch(`${backendUrl}/api/admin/workers/${id}`, {
            method: "DELETE",
            headers: {
                ...(cookieHeader ? { Cookie: cookieHeader } : {}),
                Accept: "application/json",
            },
            cache: "no-store",
        })

        const contentType = res.headers.get("content-type") || ""
        let data: unknown

        if (contentType.includes("application/json")) {
            data = await res.json()
        } else {
            const text = await res.text()
            data = text ? { success: res.ok, message: text } : { success: res.ok }
        }

        return NextResponse.json(data, { status: res.status })
    } catch (error: unknown) {
        console.error("Worker deletion proxy error:", error)

        const message =
            process.env.NODE_ENV === "development"
                ? error instanceof Error
                    ? error.message
                    : String(error)
                : "Internal server error"

        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
