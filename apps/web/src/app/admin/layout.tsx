import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/lib/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app");

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/admin"><Logo className="text-xl" /></Link>
            <span className="pill bg-ember-100 text-ember-700 text-[10px]">Admin</span>
          </div>
          <form action={logoutAction} className="shrink-0">
            <button className="btn-ghost py-1.5 px-3 text-sm">Log out</button>
          </form>
        </div>
        <nav className="mx-auto max-w-6xl flex items-center gap-1 text-sm overflow-x-auto no-scrollbar px-2 pb-2">
          <Link href="/admin" className="btn-ghost py-1.5 px-3 whitespace-nowrap">Overview</Link>
          <Link href="/admin/users" className="btn-ghost py-1.5 px-3 whitespace-nowrap">Users</Link>
          <Link href="/admin/reports" className="btn-ghost py-1.5 px-3 whitespace-nowrap">Reports</Link>
          <Link href="/admin/config" className="btn-ghost py-1.5 px-3 whitespace-nowrap">Config</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
