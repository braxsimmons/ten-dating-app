import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/lib/actions/auth";
import { AppDesktopNav, AppBottomTabs } from "@/components/AppNav";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile?.isComplete) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-ink-50">
      <ImpersonationBanner />
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/app" aria-label="Ten">
            <Logo className="text-xl" />
          </Link>
          <AppDesktopNav
            logoutForm={
              <form action={logoutAction}>
                <button className="px-3 py-1.5 rounded-full text-ink-500 hover:bg-ink-100 text-sm">
                  Log out
                </button>
              </form>
            }
          />
          <form action={logoutAction} className="md:hidden">
            <button
              aria-label="Log out"
              className="text-ink-500 hover:text-ink p-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4 md:py-6 pb-24 md:pb-10">{children}</main>
      <AppBottomTabs />
    </div>
  );
}
