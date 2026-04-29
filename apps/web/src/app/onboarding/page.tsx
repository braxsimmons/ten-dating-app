import { redirect } from "next/navigation";
import { prisma } from "@ten/database";
import { getCurrentUser } from "@/lib/auth";
import { ProfileEditor } from "@/app/app/profile/ProfileEditor";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { MIN_PHOTOS, REQUIRED_PROMPT_ANSWERS } from "@ten/shared";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile?.isComplete) redirect("/app");

  const prompts = await prisma.prompt.findMany({ where: { isActive: true } });

  const photoCount = user.photos.length;
  const answerCount = user.promptAnswers.length;
  const hasBio = !!user.profile?.bio;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/"><Logo className="text-xl" /></Link>
          <form action={logoutAction}>
            <button className="btn-ghost text-sm">Log out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Welcome, {user.firstName}.</h1>
          <p className="mt-1 text-ink-600">Build your profile so you can start your daily 10.</p>
        </div>

        <Checklist
          items={[
            { label: `Add ${MIN_PHOTOS}+ photos`, done: photoCount >= MIN_PHOTOS },
            { label: "Write a short bio", done: hasBio },
            { label: `Answer ${REQUIRED_PROMPT_ANSWERS} prompts`, done: answerCount >= REQUIRED_PROMPT_ANSWERS },
          ]}
        />

        <ProfileEditor
          user={{
            id: user.id,
            firstName: user.firstName,
            locationCity: user.locationCity ?? "",
            locationState: user.locationState ?? "",
            profile: user.profile
              ? {
                  bio: user.profile.bio ?? "",
                  datingIntent: user.profile.datingIntent ?? "",
                  height: user.profile.height ?? null,
                  education: user.profile.education ?? "",
                  work: user.profile.work ?? "",
                  religion: user.profile.religion ?? "",
                  lifestyle: user.profile.lifestyle ?? "",
                  hiddenTrait: user.profile.hiddenTrait ?? "",
                }
              : null,
          }}
          photos={user.photos.map((p) => ({ id: p.id, url: p.url, isPrimary: p.isPrimary }))}
          promptAnswers={user.promptAnswers.map((a) => ({
            promptId: a.promptId,
            promptText: a.prompt.text,
            answer: a.answer,
          }))}
          prompts={prompts.map((p) => ({ id: p.id, text: p.text }))}
        />

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">Ready?</p>
            <p className="text-sm text-ink-500">
              Profile gets marked complete automatically when you have {MIN_PHOTOS}+ photos, a bio, and {REQUIRED_PROMPT_ANSWERS} prompt answers.
            </p>
          </div>
          {photoCount >= MIN_PHOTOS && hasBio && answerCount >= REQUIRED_PROMPT_ANSWERS ? (
            <Link href="/app" className="btn-ember">Start your daily 10</Link>
          ) : (
            <button disabled className="btn-ember opacity-50">Start your daily 10</button>
          )}
        </div>
      </main>
    </div>
  );
}

function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ul className="card p-4 grid sm:grid-cols-3 gap-2">
      {items.map((it) => (
        <li
          key={it.label}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
            it.done ? "bg-emerald-50 text-emerald-700" : "bg-ink-50 text-ink-600"
          }`}
        >
          <span className={`h-4 w-4 rounded-full border ${it.done ? "bg-emerald-500 border-emerald-500" : "border-ink-300"}`} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
