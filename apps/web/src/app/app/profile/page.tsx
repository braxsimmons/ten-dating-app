import { prisma } from "@ten/database";
import { requireUser } from "@/lib/auth";
import { ProfileEditor } from "./ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const prompts = await prisma.prompt.findMany({ where: { isActive: true } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Your profile</h1>
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
    </div>
  );
}
