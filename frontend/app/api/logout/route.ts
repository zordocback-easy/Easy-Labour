import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"

    const cookieStore = await cookies()
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ")

    // Call backend logout (optional but good)
    const res = await fetch(`${backendUrl}/api/logout`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    })

    const data = await res.json().catch(() => ({ success: true }))

    // ✅ Create response
    const response = NextResponse.json(data, { status: res.status })

    // ✅ FORCE clear ALL cookies that exist on this domain
    // (this guarantees logout works even if backend cookies aren't forwarded)
    const cookieName = process.env.COOKIE_NAME || 'easy_token';
    cookieStore.getAll().forEach((c) => {
      response.cookies.set({
        name: c.name,
        value: "",
        path: "/",
        maxAge: 0,
      })
    })
    // Also explicitly clear the backend auth cookie
    response.cookies.set({
      name: cookieName,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    })

    return response
  } catch (error) {
    // even on error, still clear cookies to prevent stuck login
    const cookieStore = await cookies()
    const response = NextResponse.json({ success: false, error: "Proxy error" }, { status: 500 })

    const cookieName = process.env.COOKIE_NAME || 'easy_token';
    cookieStore.getAll().forEach((c) => {
      response.cookies.set({
        name: c.name,
        value: "",
        path: "/",
        maxAge: 0,
      })
    })
    // Also explicitly clear the backend auth cookie
    response.cookies.set({
      name: cookieName,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    })

    return response
  }
}

