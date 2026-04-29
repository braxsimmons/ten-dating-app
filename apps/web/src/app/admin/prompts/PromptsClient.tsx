"use client";

import { useState, useTransition } from "react";
import { createPromptAction, updatePromptAction } from "@/lib/actions/admin-prompts";

interface Prompt {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
  answerCount: number;
}

export function PromptsClient({ prompts }: { prompts: Prompt[] }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="card p-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          start(async () => {
            setError(null);
            const r = await createPromptAction(text);
            if (!r.ok) setError(r.error);
            else setText("");
          });
        }}
      >
        <input
          className="input flex-1"
          placeholder='e.g. "The way to my heart is..."'
          maxLength={140}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={pending || text.trim().length < 4} className="btn-primary">Add prompt</button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="card overflow-hidden">
        <ul>
          {prompts.map((p) => (
            <PromptRow key={p.id} prompt={p} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function PromptRow({ prompt }: { prompt: Prompt }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prompt.text);
  const [pending, start] = useTransition();

  return (
    <li className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-ink-100 last:border-0 ${prompt.isActive ? "" : "opacity-50"}`}>
      {editing ? (
        <input className="input flex-1" value={draft} maxLength={140} onChange={(e) => setDraft(e.target.value)} />
      ) : (
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{prompt.text}</p>
          <p className="text-xs text-ink-500 mt-0.5">
            {prompt.answerCount} answers · {prompt.isActive ? "active" : "archived"}
          </p>
        </div>
      )}
      <div className="flex gap-1 shrink-0">
        {editing ? (
          <>
            <button
              disabled={pending}
              onClick={() => start(async () => {
                await updatePromptAction({ id: prompt.id, text: draft });
                setEditing(false);
              })}
              className="btn-primary py-1.5 px-3"
            >Save</button>
            <button onClick={() => { setEditing(false); setDraft(prompt.text); }} className="btn-ghost py-1.5 px-3">Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 px-3">Edit</button>
            <button
              disabled={pending}
              onClick={() => start(async () => { await updatePromptAction({ id: prompt.id, isActive: !prompt.isActive }); })}
              className="btn-ghost py-1.5 px-3"
            >
              {prompt.isActive ? "Archive" : "Restore"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
