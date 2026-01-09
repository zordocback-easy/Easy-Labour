import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

function cookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
}

export async function GET(request: Request) {
  const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
  const url = new URL(request.url)

  const workerId = url.searchParams.get("workerId") || ""
  const my = url.searchParams.get("my") === "1"
  const limit = url.searchParams.get("limit") || "20"
  const skip = url.searchParams.get("skip") || "0"

  if (!workerId) return NextResponse.json({ success: false, error: "workerId is required" }, { status: 400 })

  const ck = cookieHeader(await cookies())

  const endpoint = my
    ? `${backendUrl}/api/workers/${workerId}/my-review`
    : `${backendUrl}/api/workers/${workerId}/reviews?limit=${encodeURIComponent(limit)}&skip=${encodeURIComponent(skip)}`

  const res = await fetch(endpoint, { headers: { Cookie: ck }, cache: "no-store" })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
  const body = await request.json().catch(() => ({}))
  const workerId = String(body.workerId || "")

  if (!workerId) return NextResponse.json({ success: false, error: "workerId is required" }, { status: 400 })

  const ck = cookieHeader(await cookies())

  const res = await fetch(`${backendUrl}/api/workers/${workerId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ck },
    body: JSON.stringify({ rating: body.rating, text: body.text }),
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(request: Request) {
  const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
  const url = new URL(request.url)
  const workerId = url.searchParams.get("workerId") || ""

  if (!workerId) return NextResponse.json({ success: false, error: "workerId is required" }, { status: 400 })

  const ck = cookieHeader(await cookies())

  const res = await fetch(`${backendUrl}/api/workers/${workerId}/reviews`, {
    method: "DELETE",
    headers: { Cookie: ck },
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

