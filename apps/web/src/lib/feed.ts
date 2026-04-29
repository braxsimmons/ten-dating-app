import { prisma } from "@ten/database";
import type { Interest } from "@ten/database";
import { interestMatches } from "./swipe";

export interface FeedCard {
  id: string;
  firstName: string;
  age: number;
  locationCity: string | null;
  locationState: string | null;
  bio: string | null;
  datingIntent: string | null;
  height: number | null;
  education: string | null;
  work: string | null;
  religion: string | null;
  lifestyle: string | null;
  hiddenTrait: string | null;
  photos: { id: string; url: string }[];
  prompts: { promptId: string; text: string; answer: string }[];
  doubledDownByThem: boolean;
}

const FEED_LIMIT = 30;

export async function getCandidates(viewerId: string): Promise<FeedCard[]> {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, gender: true, interestedIn: true },
  });
  if (!viewer) return [];


  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedUserId: viewerId }] },
    select: { blockerId: true, blockedUserId: true },
  });
  const blockedIds = new Set<string>();
  for (const b of blocks) {
    blockedIds.add(b.blockerId);
    blockedIds.add(b.blockedUserId);
  }
  blockedIds.delete(viewerId);


  const swipes = await prisma.swipeAction.findMany({
    where: { swiperId: viewerId, isRewound: false },
    select: { targetUserId: true },
  });
  const swipedIds = new Set(swipes.map((s) => s.targetUserId));


  const interestFilter: Interest[] =
    viewer.interestedIn === "everyone"
      ? ["women", "men", "everyone"]
      : ["women", "men", "everyone"];

  let candidates = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(new Set([viewerId, ...blockedIds, ...swipedIds])) },
      isBanned: false,
      isShadowBanned: false,
      profile: { isComplete: true },
      photos: { some: {} },
      ...(viewer.interestedIn === "women"
        ? { gender: "woman" }
        : viewer.interestedIn === "men"
        ? { gender: "man" }
        : {}),
      interestedIn: { in: interestFilter },
    },
    include: {
      profile: true,
      photos: { orderBy: { order: "asc" } },
      promptAnswers: { include: { prompt: true } },
      swipesGiven: {
        where: { targetUserId: viewerId, action: "like", isRewound: false },
        select: { isDoubleDown: true },
        take: 1,
      },
    },
    orderBy: [{ lastActiveAt: "desc" }],
    take: FEED_LIMIT * 2,
  });

  candidates = candidates.filter((c) => interestMatches(viewer, c));


  candidates.sort((a, b) => {
    const ad = a.swipesGiven[0]?.isDoubleDown ? 1 : 0;
    const bd = b.swipesGiven[0]?.isDoubleDown ? 1 : 0;
    return bd - ad;
  });

  return candidates.slice(0, FEED_LIMIT).map((c) => ({
    id: c.id,
    firstName: c.firstName,
    age: ageFromDob(c.dateOfBirth),
    locationCity: c.locationCity,
    locationState: c.locationState,
    bio: c.profile?.bio ?? null,
    datingIntent: c.profile?.datingIntent ?? null,
    height: c.profile?.height ?? null,
    education: c.profile?.education ?? null,
    work: c.profile?.work ?? null,
    religion: c.profile?.religion ?? null,
    lifestyle: c.profile?.lifestyle ?? null,
    hiddenTrait: null,
    photos: c.photos.map((p) => ({ id: p.id, url: p.url })),
    prompts: c.promptAnswers.map((a) => ({
      promptId: a.promptId,
      text: a.prompt.text,
      answer: a.answer,
    })),
    doubledDownByThem: !!c.swipesGiven[0]?.isDoubleDown,
  }));
}

export function ageFromDob(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
