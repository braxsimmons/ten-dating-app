import { prisma } from "@ten/database";
import { PromptsClient } from "./PromptsClient";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const [prompts, answersByPromptRaw] = await Promise.all([
    prisma.prompt.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] }),
    prisma.promptAnswer.groupBy({ by: ["promptId"], _count: { _all: true } }),
  ]);
  const usage = new Map(answersByPromptRaw.map((a) => [a.promptId, a._count._all]));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Prompt library</h1>
      <p className="text-ink-600 max-w-xl">
        These are the prompts users pick from when filling out their profile. Add new ones or
        retire dated ones — existing answers stay attached to retired prompts so nothing breaks.
      </p>
      <PromptsClient
        prompts={prompts.map((p) => ({
          id: p.id,
          text: p.text,
          isActive: p.isActive,
          createdAt: p.createdAt.toISOString(),
          answerCount: usage.get(p.id) ?? 0,
        }))}
      />
    </div>
  );
}
