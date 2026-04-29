"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setBanAction, setShadowBanAction } from "@/lib/actions/admin";

export function UserRow({
  user,
}: {
  user: {
    id: string;
    email: string;
    firstName: string;
    role: string;
    isBanned: boolean;
    isShadowBanned: boolean;
    createdAt: string;
  };
}) {
  const [pending, start] = useTransition();
  return (
    <tr className="border-t border-ink-100">
      <td className="px-4 py-3">
        <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
          {user.firstName}
        </Link>
        <div className="text-xs text-ink-500">{user.email}</div>
      </td>
      <td className="px-4 py-3 capitalize">{user.role}</td>
      <td className="px-4 py-3">
        {user.isBanned ? (
          <span className="pill bg-red-100 text-red-700">Banned</span>
        ) : user.isShadowBanned ? (
          <span className="pill bg-yellow-100 text-yellow-700">Shadow</span>
        ) : (
          <span className="pill">Active</span>
        )}
      </td>
      <td className="px-4 py-3 text-ink-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right space-x-1">
        <button
          disabled={pending}
          onClick={() => start(async () => { await setBanAction(user.id, !user.isBanned); })}
          className="btn-ghost py-1.5 px-3"
        >
          {user.isBanned ? "Unban" : "Ban"}
        </button>
        <button
          disabled={pending}
          onClick={() => start(async () => { await setShadowBanAction(user.id, !user.isShadowBanned); })}
          className="btn-ghost py-1.5 px-3"
        >
          {user.isShadowBanned ? "Unshadow" : "Shadow"}
        </button>
      </td>
    </tr>
  );
}
