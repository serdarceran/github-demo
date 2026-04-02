"use client";

import { useEffect, useState } from "react";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

type UserRow = {
  id: string;
  email: string | null;
  isGuest: boolean;
  createdAt: string;
  roles: string[];
};

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: UserRow[]) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  async function toggleRole(userId: string, roleName: string, currentRoles: string[]) {
    if (roleName === "system-admin") return;

    const newRoles = currentRoles.includes(roleName)
      ? currentRoles.filter((r) => r !== roleName)
      : [...currentRoles, roleName];

    const res = await fetch(`/api/admin/users/${userId}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: newRoles }),
    });

    if (res.ok) {
      const updated: { id: string; roles: string[] } = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, roles: updated.roles } : u))
      );
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 animate-pulse">Loading users…</p>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Email
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Roles
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-5 py-3 text-gray-700">
                {user.email ?? (
                  <span className="text-gray-400 italic">
                    guest ({user.id.slice(0, 8)})
                  </span>
                )}
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  {user.roles.includes("system-admin") && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      system-admin
                    </span>
                  )}
                  {ASSIGNABLE_ROLES.map((role) => {
                    const active = user.roles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(user.id, role, user.roles)}
                        title={active ? `Remove ${role}` : `Add ${role}`}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-colors ${
                          active
                            ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 hover:text-gray-600"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
