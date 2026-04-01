import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminUsersPanel from "@/components/AdminUsersPanel";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles?.includes("system-admin")) {
    redirect("/");
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 pb-24 sm:pb-8 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            Admin — User Management
          </h1>
          <AdminUsersPanel />
        </div>
      </div>
    </>
  );
}
