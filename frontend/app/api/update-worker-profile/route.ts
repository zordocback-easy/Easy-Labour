import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"

    // Check if it's FormData or JSON
    const contentType = request.headers.get("content-type") || ""
    let body: any

    if (contentType.includes("multipart/form-data")) {
      body = await request.formData()
    } else {
      body = await request.text()
    }

    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const headers: Record<string, string> = {
      Cookie: cookieHeader,
    }

    if (!contentType.includes("multipart/form-data")) {
      headers["Content-Type"] = "application/json"
    }

    const res = await fetch(`${backendUrl}/api/update-worker-profile`, {
      method: "POST",
      headers,
      body,
    })

    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
  }
}

