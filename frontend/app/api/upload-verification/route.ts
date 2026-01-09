import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    
    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    // Get FormData from request
    const formData = await request.formData()

    const res = await fetch(`${backendUrl}/api/upload-verification`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
      body: formData,
    })

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid response from server" }, { status: 500 })
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Upload verification proxy error:", error)
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
  }
}









