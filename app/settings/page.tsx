"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <>
    <Navbar />
    <div className="bg-gray-50 pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="px-5 py-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-800 truncate ml-4 text-right">{session?.user?.email}</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200">
          <div className="px-5 py-4">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Danger Zone</h2>
            <p className="text-xs text-gray-400 mb-4">These actions are permanent and cannot be undone.</p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Delete account</p>
                <p className="text-xs text-gray-400 mt-0.5">Permanently deletes your account and all your goals.</p>
              </div>
              <Link
                href="/deregister"
                className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50"
              >
                Delete account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
