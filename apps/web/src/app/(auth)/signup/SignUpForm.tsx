"use client";

import { useState, useTransition } from "react";
import { signUpAction } from "@/lib/actions/auth";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      action={(fd) =>
        start(async () => {
          setError(null);
          const r = await signUpAction(fd);
          if (r?.error) setError(r.error);
        })
      }
    >
      <div>
        <label className="label">First name</label>
        <input name="firstName" required maxLength={50} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date of birth</label>
          <input name="dateOfBirth" type="date" required className="input" />
        </div>
        <div>
          <label className="label">City</label>
          <input name="locationCity" placeholder="Brooklyn" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">I am a...</label>
          <select name="gender" required defaultValue="" className="input">
            <option value="" disabled>Select</option>
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="nonbinary">Nonbinary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Interested in</label>
          <select name="interestedIn" required defaultValue="" className="input">
            <option value="" disabled>Select</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="everyone">Everyone</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label">Password</label>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className="input" />
        <p className="mt-1 text-xs text-ink-500">At least 8 characters.</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="btn-ember w-full py-3 text-base" disabled={pending}>
        {pending ? "Creating..." : "Start your daily 10"}
      </button>

      <p className="text-center text-xs text-ink-500">
        You must be 18+. By signing up you agree to be a decent human.
      </p>
    </form>
  );
}
