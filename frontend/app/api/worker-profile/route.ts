import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    
    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    // First get current user to get profileId
    const userRes = await fetch(`${backendUrl}/api/current-user`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    })

    const userData = await userRes.json()
    
    if (!userData.user || userData.user.role !== "worker" || !userData.user.profileId) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 })
    }

    // Fetch worker profile by ID
    const workerRes = await fetch(`${backendUrl}/api/workers/${userData.user.profileId}`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    })

    if (!workerRes.ok) {
      return NextResponse.json({ error: "Worker profile not found" }, { status: 404 })
    }

    const workerData = await workerRes.json()
    
    return NextResponse.json(workerData, {
      status: workerRes.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Worker profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch worker profile" }, { status: 500 })
  }
}










