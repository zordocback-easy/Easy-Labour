import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "6"

    const res = await fetch(`${backendUrl}/api/workers-featured?limit=${limit}`, {
      method: "GET",
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, workers: [] }, { status: res.status })
    }

    const data = await res.json()
    
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Featured workers fetch error:", error)
    return NextResponse.json({ success: false, workers: [] }, { status: 500 })
  }
}










