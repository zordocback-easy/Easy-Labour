import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "https://easy-labour.onrender.com"

/**
 * Common data processing for worker objects received from backend
 */
export async function processWorkerData(worker: any) {
    if (!worker) return null

    // Convert MongoDB _id to id for compatibility
    if (worker._id) {
        worker.id = worker._id.toString()
    }

    // Convert date strings to Date objects
    if (worker.packageExpiry && typeof worker.packageExpiry === "string") {
        worker.packageExpiry = new Date(worker.packageExpiry)
    }
    if (worker.verifiedAt && typeof worker.verifiedAt === "string") {
        worker.verifiedAt = new Date(worker.verifiedAt)
    }
    if (worker.createdAt && typeof worker.createdAt === "string") {
        worker.createdAt = new Date(worker.createdAt)
    }

    // Ensure skills is an array
    if (typeof worker.skills === "string") {
        worker.skills = worker.skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
    }
    if (!Array.isArray(worker.skills)) {
        worker.skills = []
    }

    // Ensure locality is an array
    if (typeof worker.locality === "string") {
        worker.locality = [worker.locality]
    }
    if (!Array.isArray(worker.locality)) {
        worker.locality = []
    }

    return worker
}

/**
 * Fetch a worker profile by ID from the backend
 */
export async function getWorkerById(id: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/workers/${id}`, {
            method: "GET",
            cache: "no-store",
        })

        if (!res.ok) return null

        const data = await res.json()
        return processWorkerData(data.worker)
    } catch (error) {
        console.error("getWorkerById error:", error)
        return null
    }
}

/**
 * Fetch the current logged-in worker's profile
 */
export async function getAuthenticatedWorkerProfile() {
    try {
        const cookieStore = await cookies()
        const cookieHeader = cookieStore
            .getAll()
            .map((c) => `${c.name}=${c.value}`)
            .join("; ")

        // 1. Get current user
        const userRes = await fetch(`${BACKEND_URL}/api/current-user`, {
            method: "GET",
            headers: { Cookie: cookieHeader },
            cache: "no-store",
        })

        const userData = await userRes.json()
        if (!userData.user || userData.user.role !== "worker" || !userData.user.profileId) {
            return null
        }

        // 2. Fetch worker profile by ID
        const workerRes = await fetch(`${BACKEND_URL}/api/workers/${userData.user.profileId}`, {
            method: "GET",
            headers: { Cookie: cookieHeader },
            cache: "no-store",
        })

        if (!workerRes.ok) return null

        const workerData = await workerRes.json()
        return processWorkerData(workerData.worker)
    } catch (error) {
        console.error("getAuthenticatedWorkerProfile error:", error)
        return null
    }
}

/**
 * Fetch a list of workers with filters
 */
export async function getWorkers(filters: { category?: string; city?: string; locality?: string }) {
    try {
        const params = new URLSearchParams()
        if (filters.category) params.append("category", filters.category)
        if (filters.city) params.append("city", filters.city)
        if (filters.locality) params.append("locality", filters.locality)

        const res = await fetch(`${BACKEND_URL}/api/workers?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
        })

        if (!res.ok) return []

        const data = await res.json()
        const workers = data.workers || []

        return Promise.all(workers.map((w: any) => processWorkerData(w)))
    } catch (error) {
        console.error("getWorkers error:", error)
        return []
    }
}
