import { prisma } from "@ten/database";
import { ConfigClient } from "./ConfigClient";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const [configs, flags] = await Promise.all([
    prisma.appConfig.findMany({ orderBy: { key: "asc" } }),
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Configuration</h1>
      <ConfigClient
        configs={configs.map((c) => ({ key: c.key, value: c.value }))}
        flags={flags.map((f) => ({ key: f.key, value: f.value, description: f.description }))}
      />
    </div>
  );
}
