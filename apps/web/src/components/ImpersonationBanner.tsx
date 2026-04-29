import { prisma } from "@ten/database";
import { getImpersonationContext } from "@/lib/auth";
import { stopImpersonationAction } from "@/lib/actions/admin-impersonate";

export async function ImpersonationBanner() {
  const ctx = await getImpersonationContext();
  if (!ctx) return null;

  const target = await prisma.user.findUnique({
    where: { id: ctx.targetUserId },
    select: { firstName: true, email: true },
  });
  if (!target) return null;

  return (
    <div className="sticky top-0 z-40 bg-ember text-white text-xs sm:text-sm">
      <div className="mx-auto max-w-3xl px-4 py-2 flex items-center justify-between gap-2">
        <span>
          <span className="font-semibold">Impersonating:</span> {target.firstName} ({target.email})
        </span>
        <form action={stopImpersonationAction}>
          <button className="underline underline-offset-2 hover:text-white/90">Stop &amp; return to admin</button>
        </form>
      </div>
    </div>
  );
}
