"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function GoogleOAuthHandlerContent() {
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
    })
      .then((res) => {
        if (res.ok) {
          router.replace("/");
        } else {
          router.replace("/login?error=cookie_set_failed");
        }
      })
      .catch((err) => {
        console.error("OAuth cookie set error:", err);
        router.replace("/login?error=cookie_set_failed");
      });
  }, [params, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Signing you in...</p>
      </div>
    </div>
  );
}

export default function GoogleOAuthHandler() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <GoogleOAuthHandlerContent />
    </Suspense>
  );
}
