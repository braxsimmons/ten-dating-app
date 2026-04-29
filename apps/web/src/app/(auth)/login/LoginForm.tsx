"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      action={(fd) =>
        start(async () => {
          setError(null);
          const r = await loginAction(fd);
          if (r?.error) setError(r.error);
        })
      }
    >
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-ember w-full py-3 text-base" disabled={pending}>
        {pending ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}
