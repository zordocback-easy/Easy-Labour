import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const body = await req.text()

    const res = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse login response:", text)
      return NextResponse.json({ success: false, error: "Invalid response from server" }, { status: 500 })
    }

    // If login successful, extract token from backend cookie and set it in Next.js
    if (res.ok && data.success) {
      const setCookieHeader = res.headers.get("set-cookie")
      if (setCookieHeader) {
        // Extract token from backend cookie - handle multiple cookie formats
        const cookieName = process.env.COOKIE_NAME || "easy_token"
        // Try to match the cookie value (handles URL encoding and various formats)
        const cookieMatch = setCookieHeader.match(new RegExp(`${cookieName}=([^;,\\s]+)`, "i"))
        if (cookieMatch) {
          const token = decodeURIComponent(cookieMatch[1])
          const cookieStore = await cookies()

          // Set cookie for frontend domain
          cookieStore.set(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
          })
        } else {
          console.warn("Could not extract token from Set-Cookie header:", setCookieHeader)
        }
      }
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Login proxy error:", error)
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })
  }
}

