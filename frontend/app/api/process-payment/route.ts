import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const body = await request.text()

    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/process-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body,
    })

    const text = await res.text()

    // Log non-ok responses from backend
    if (!res.ok) {
      console.error(`Backend error (${res.status}):`, text)
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid response from backend" }, { status: 500 })
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Payment proxy error:", error)
    return NextResponse.json({ success: false, error: "Payment submission failed (Proxy)" }, { status: 500 })
  }
}

