"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { DATING_INTENTS, MAX_PHOTOS, MIN_PHOTOS, REQUIRED_PROMPT_ANSWERS } from "@ten/shared";
import {
  updateProfileAction,
  uploadPhotoAction,
  deletePhotoAction,
  answerPromptAction,
  deletePromptAnswerAction,
} from "@/lib/actions/profile";

interface Props {
  user: {
    id: string;
    firstName: string;
    locationCity: string;
    locationState: string;
    profile: {
      bio: string;
      datingIntent: string;
      height: number | null;
      education: string;
      work: string;
      religion: string;
      lifestyle: string;
      hiddenTrait: string;
    } | null;
  };
  photos: { id: string; url: string; isPrimary: boolean }[];
  promptAnswers: { promptId: string; promptText: string; answer: string }[];
  prompts: { id: string; text: string }[];
}

export function ProfileEditor({ user, photos, promptAnswers, prompts }: Props) {
  return (
    <div className="space-y-6">
      <PhotoSection photos={photos} />
      <BioSection user={user} />
      <PromptSection prompts={prompts} answers={promptAnswers} />
    </div>
  );
}

function PhotoSection({ photos }: { photos: { id: string; url: string; isPrimary: boolean }[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="card p-5 space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="font-display text-xl font-semibold">Photos</p>
          <p className="text-sm text-ink-500">
            {photos.length} of {MAX_PHOTOS} uploaded · min {MIN_PHOTOS}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            setError(null);
            start(async () => {
              const r = await uploadPhotoAction(fd);
              if (r?.error) setError(r.error);
              if (inputRef.current) inputRef.current.value = "";
            });
          }}
        />
        <button
          type="button"
          disabled={pending || photos.length >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
          className="btn-primary"
        >
          {pending ? "Uploading..." : "Upload photo"}
        </button>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-ink-100 group">
            <Image src={p.url} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-cover" />
            {p.isPrimary ? (
              <span className="absolute top-2 left-2 pill bg-white text-ink-700 text-[10px]">Cover</span>
            ) : null}
            <button
              type="button"
              onClick={() => start(async () => { await deletePhotoAction(p.id); })}
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
        {photos.length === 0 ? (
          <div className="col-span-full rounded-xl bg-ink-50 border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
            Add at least {MIN_PHOTOS} photos. The first becomes your cover.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BioSection({ user }: { user: Props["user"] }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <section className="card p-5">
      <p className="font-display text-xl font-semibold">About you</p>
      <form
        className="mt-4 grid gap-4"
        action={(fd) =>
          start(async () => {
            const r = await updateProfileAction(fd);
            setSaved(!r?.error);
          })
        }
      >
        <div>
          <label className="label">Bio</label>
          <textarea
            name="bio"
            rows={3}
            maxLength={500}
            placeholder="Two sentences about you. Real, not corporate."
            defaultValue={user.profile?.bio ?? ""}
            className="input"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Looking for</label>
            <select name="datingIntent" defaultValue={user.profile?.datingIntent ?? ""} className="input">
              <option value="">Tell people what you want</option>
              {DATING_INTENTS.map((d) => (
                <option key={d} value={d.replace(/-/g, "_")}>{d.replace(/-/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" min={120} max={250} name="height" defaultValue={user.profile?.height ?? ""} className="input" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field name="education" label="Education" defaultValue={user.profile?.education} />
          <Field name="work" label="Work" defaultValue={user.profile?.work} />
          <Field name="religion" label="Religion" defaultValue={user.profile?.religion} />
          <Field name="lifestyle" label="Lifestyle" defaultValue={user.profile?.lifestyle} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field name="locationCity" label="City" defaultValue={user.locationCity} />
          <Field name="locationState" label="State" defaultValue={user.locationState} />
        </div>

        <div>
          <label className="label">Hidden trait (revealed only after match)</label>
          <textarea
            name="hiddenTrait"
            rows={2}
            maxLength={280}
            placeholder="Something fun that's just for matches."
            defaultValue={user.profile?.hiddenTrait ?? ""}
            className="input"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </button>
          {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
        </div>
      </form>
    </section>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} defaultValue={defaultValue ?? ""} maxLength={100} className="input" />
    </div>
  );
}

function PromptSection({
  prompts,
  answers,
}: {
  prompts: { id: string; text: string }[];
  answers: { promptId: string; promptText: string; answer: string }[];
}) {
  const answered = new Map(answers.map((a) => [a.promptId, a.answer]));
  const [pending, start] = useTransition();

  return (
    <section className="card p-5">
      <p className="font-display text-xl font-semibold">Prompts</p>
      <p className="text-sm text-ink-500">Pick at least {REQUIRED_PROMPT_ANSWERS}.</p>
      <div className="mt-4 space-y-3">
        {prompts.map((p) => {
          const current = answered.get(p.id) ?? "";
          return (
            <form
              key={p.id}
              className="card p-4"
              action={(fd) => start(async () => {
                fd.set("promptId", p.id);
                if (!String(fd.get("answer") ?? "").trim()) {
                  await deletePromptAnswerAction(p.id);
                  return;
                }
                await answerPromptAction(fd);
              })}
            >
              <p className="text-xs uppercase tracking-wider text-ink-500">{p.text}</p>
              <textarea
                name="answer"
                rows={2}
                maxLength={280}
                defaultValue={current}
                className="input mt-2"
              />
              <div className="mt-2 flex justify-end">
                <button className="btn-outline py-1.5" disabled={pending}>Save</button>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}
