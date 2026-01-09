import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    
    // Forward cookies from the request
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ")

    const res = await fetch(`${backendUrl}/api/current-user`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    })

    const data = await res.json()
    
    // Forward Set-Cookie headers if present
    const setCookieHeaders = res.headers.get("set-cookie")
    const responseHeaders: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (setCookieHeaders) {
      responseHeaders["Set-Cookie"] = setCookieHeaders
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

