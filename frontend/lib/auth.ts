"use server"

import { cookies } from "next/headers"
export async function logout() {
  const cookieStore = await cookies()
  const cookieName = process.env.COOKIE_NAME || "easy_token"
  cookieStore.delete(cookieName)
  // Also delete old legacy cookies just in case
  cookieStore.delete("userId")
  cookieStore.delete("userRole")
  cookieStore.delete("profileId")
  return { success: true }
}

export async function getCurrentUser() {
  try {
    const backendUrl = process.env.BACKEND_URL || "https://easy-labour.onrender.com"
    const cookieStore = await cookies()
    const cookieName = process.env.COOKIE_NAME || "easy_token"
    const token = cookieStore.get(cookieName)

    if (!token) {
      return null
    }

    // Call backend to verify token and get user info
    const res = await fetch(`${backendUrl}/api/current-user`, {
      method: "GET",
      headers: {
        Cookie: `${cookieName}=${token.value}`,
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()

    if (!data.user) {
      return null
    }

    return {
      id: data.user.id || data.user.email,
      role: data.user.role as "worker" | "client" | "admin",
      profileId: data.user.profileId || "",
      email: data.user.email,
    }
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
}
