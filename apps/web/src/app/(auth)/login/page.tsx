import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="card p-8 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-600">Pick up where you left off.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          Make an account
        </Link>
      </p>
    </div>
  );
}
