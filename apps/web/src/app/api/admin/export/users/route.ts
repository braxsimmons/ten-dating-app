import { prisma } from "@ten/database";
import { requireAdmin } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { isComplete: true, datingIntent: true } },
      wallet: true,
      _count: { select: { swipesGiven: true, photos: true, matchesAsA: true, matchesAsB: true } },
    },
  });

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    role: u.role,
    gender: u.gender,
    interestedIn: u.interestedIn,
    isBanned: u.isBanned,
    isShadowBanned: u.isShadowBanned,
    isVerified: u.isVerified,
    locationCity: u.locationCity ?? "",
    locationState: u.locationState ?? "",
    profileComplete: u.profile?.isComplete ?? false,
    datingIntent: u.profile?.datingIntent ?? "",
    photos: u._count.photos,
    swipesGiven: u._count.swipesGiven,
    matches: u._count.matchesAsA + u._count.matchesAsB,
    extraSwipes: u.wallet?.extraSwipes ?? 0,
    rewinds: u.wallet?.rewinds ?? 0,
    doubleDowns: u.wallet?.doubleDowns ?? 0,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
  }));

  await prisma.adminAction.create({
    data: { adminUserId: admin.id, action: "export_data", notes: `users (${rows.length})` },
  });

  return csvResponse(`ten-users-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
}
