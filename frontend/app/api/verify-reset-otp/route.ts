import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:5000";
        const body = await req.json();

        const res = await fetch(`${backendUrl}/api/verify-reset-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: any) {
        console.error("Verify reset OTP proxy error:", error.message || error);
        return NextResponse.json({
            success: false,
            error: `Connection failed: ${error.message || 'Unknown'}`
        }, { status: 500 });
    }
}

