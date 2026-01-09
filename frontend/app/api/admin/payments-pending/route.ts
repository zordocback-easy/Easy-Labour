import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    
    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/admin/payments-pending`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch workers" }, { status: res.status })
    }

    const data = await res.json()
    
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Admin payments pending fetch error:", error)
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
  }
}










