"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/app", label: "Feed", icon: FeedIcon },
  { href: "/app/matches", label: "Matches", icon: MatchesIcon },
  { href: "/app/store", label: "Store", icon: StoreIcon },
  { href: "/app/profile", label: "You", icon: ProfileIcon },
];

export function AppDesktopNav({ logoutForm }: { logoutForm: React.ReactNode }) {
  const path = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-1 text-sm">
      {TABS.map((t) => {
        const active = path === t.href || (t.href !== "/app" && path.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "px-3 py-1.5 rounded-full transition",
              active ? "bg-ink text-white" : "hover:bg-ink-100 text-ink-700",
            )}
          >
            {t.label}
          </Link>
        );
      })}
      {logoutForm}
    </nav>
  );
}

export function AppBottomTabs() {
  const path = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-ink-100 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = path === t.href || (t.href !== "/app" && path.startsWith(t.href));
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition",
                  active ? "text-ember" : "text-ink-500",
                )}
              >
                <Icon active={active} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-ember" : ""}>
      <rect x="6" y="4" width="14" height="16" rx="3" />
      <path d="M3 7v12a3 3 0 0 0 3 3h11" opacity="0.5" />
    </svg>
  );
}
function MatchesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function StoreIcon({ active: _ }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V6l-3-4z" />
      <path d="M3 8v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
    </svg>
  );
}
function ProfileIcon({ active: _ }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
