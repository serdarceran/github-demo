"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DeregisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="animate-pulse text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/deregister", { method: "POST" });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to <strong>{session?.user?.email}</strong>. Click it to permanently delete your account.
          </p>
          <Link href="/" className="text-sky-600 hover:text-sky-700 text-sm font-medium">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900">Delete your account</h1>
          <p className="text-gray-500 text-sm mt-2">
            This will permanently delete your account and all your goals. This action cannot be undone.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-600">
            A confirmation email will be sent to <strong>{session?.user?.email}</strong>. You must click the link in that email to complete the deletion.
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? "Sending…" : "Send confirmation email"}
          </button>

          <Link
            href="/"
            className="block text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
