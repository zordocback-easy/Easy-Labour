"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleOAuthHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.replace("/login?error=missing_token");
      return;
    }

    // call next API route to set httpOnly cookie on FRONTEND domain
    fetch("/api/oauth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    })
      .then(() => router.replace("/"))
      .catch(() => router.replace("/login?error=cookie_set_failed"));
  }, [params, router]);

  return <div className="p-6">Signing you in…</div>;
}
