"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

type Status = "loading" | "success" | "already_deleted" | "invalid" | "expired";

export default function DeregisterConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`/api/auth/deregister/confirm?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          await signOut({ redirect: false });
          setTimeout(() => router.push("/"), 2500);
        } else {
          const data = await res.json();
          if (data.error === "ALREADY_DELETED") {
            setStatus("already_deleted");
            await signOut({ redirect: false });
          } else {
            setStatus(data.error === "INVALID_OR_EXPIRED" ? "expired" : "invalid");
          }
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="animate-pulse text-gray-400 text-sm">Deleting your account…</p>
      </div>
    );
  }

  if (status === "success" || status === "already_deleted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account deleted</h1>
          <p className="text-gray-500 text-sm">Your account and all data have been removed. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {status === "expired" ? "Link expired" : "Invalid link"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {status === "expired"
            ? "This deletion link has expired. Please request a new one from account settings."
            : "This deletion link is invalid."}
        </p>
        <Link href="/deregister" className="text-sm text-sky-600 hover:text-sky-700 font-medium">
          ← Request a new link
        </Link>
      </div>
    </div>
  );
}
