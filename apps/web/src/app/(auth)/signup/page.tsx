import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <div className="card p-8 animate-fade-in">
      <h1 className="font-display text-3xl font-semibold">Make an account</h1>
      <p className="mt-1 text-sm text-ink-600">10 chances a day starts here.</p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
