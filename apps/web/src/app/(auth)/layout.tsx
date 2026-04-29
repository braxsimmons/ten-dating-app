import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="px-4 py-6">
        <Link href="/" className="inline-block">
          <Logo className="text-2xl" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
