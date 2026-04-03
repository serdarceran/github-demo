"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "invalid" | "expired";

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setStatus("invalid");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          timeoutId = setTimeout(() => router.push("/"), 2500);
        } else {
          const data = await res.json();
          setStatus(data.error === "INVALID_OR_EXPIRED" ? "expired" : "invalid");
        }
      })
      .catch(() => setStatus("invalid"));

    return () => clearTimeout(timeoutId);
  }, [token, router]);

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);

    const res = await fetch("/api/auth/resend-activation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setResendLoading(false);
    if (res.ok) setResendSent(true);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="animate-pulse text-gray-400 text-sm">Activating your account…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account activated!</h1>
          <p className="text-gray-500 text-sm">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  // expired or invalid
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {status === "expired" ? "Link expired" : "Invalid activation link"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {status === "expired"
            ? "This activation link has expired. Request a new one below."
            : "This activation link is invalid. Try registering again or request a new link."}
        </p>

        {resendSent ? (
          <p className="text-sm text-green-600 font-medium">New activation email sent! Check your inbox.</p>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleResend}
              disabled={resendLoading || !email}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {resendLoading ? "Sending…" : "Resend activation email"}
            </button>
          </div>
        )}

        <Link href="/register" className="block mt-4 text-sm text-gray-500 hover:text-gray-700">
          ← Back to register
        </Link>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateContent />
    </Suspense>
  );
}
