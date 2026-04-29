"use client";

import { useState, useTransition } from "react";
import { setConfigAction, setFeatureFlagAction } from "@/lib/actions/admin";

interface Cfg { key: string; value: string }
interface Flag { key: string; value: boolean; description: string | null }

export function ConfigClient({ configs, flags }: { configs: Cfg[]; flags: Flag[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card p-5">
        <p className="font-display text-lg font-semibold">App config</p>
        <div className="mt-3 space-y-3">
          {configs.map((c) => (
            <ConfigRow key={c.key} config={c} />
          ))}
          {configs.length === 0 ? (
            <p className="text-sm text-ink-500">No config keys yet.</p>
          ) : null}
        </div>
      </section>

      <section className="card p-5">
        <p className="font-display text-lg font-semibold">Feature flags</p>
        <div className="mt-3 space-y-2">
          {flags.map((f) => (
            <FlagRow key={f.key} flag={f} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ConfigRow({ config }: { config: Cfg }) {
  const [val, setVal] = useState(config.value);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await setConfigAction({ key: config.key, value: val });
          setSaved(true);
          setTimeout(() => setSaved(false), 1200);
        });
      }}
    >
      <div className="flex-1">
        <label className="label">{config.key}</label>
        <input className="input" value={val} onChange={(e) => setVal(e.target.value)} />
      </div>
      <button className="btn-primary py-2" disabled={pending}>Save</button>
      {saved ? <span className="text-xs text-emerald-600">Saved</span> : null}
    </form>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const [pending, start] = useTransition();
  const [val, setVal] = useState(flag.value);

  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2">
      <div>
        <p className="font-medium">{flag.key}</p>
        {flag.description ? <p className="text-xs text-ink-500">{flag.description}</p> : null}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const next = !val;
          setVal(next);
          start(async () => { await setFeatureFlagAction({ key: flag.key, value: next }); });
        }}
        className={`relative h-6 w-11 rounded-full transition ${val ? "bg-ember" : "bg-ink-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${val ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
