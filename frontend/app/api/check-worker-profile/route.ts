import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    
    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/check-worker-profile`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    })

    const data = await res.json()
    
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return NextResponse.json({ hasProfile: false }, { status: 500 })
  }
}

