import { requireUser } from "@/lib/auth";
import { getCandidates } from "@/lib/feed";
import { getSwipeBudget } from "@/lib/swipe";
import { SwipeDeck } from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await requireUser();
  const [budget, candidates] = await Promise.all([
    getSwipeBudget(user.id),
    getCandidates(user.id),
  ]);

  const wallet = {
    extraSwipes: user.wallet?.extraSwipes ?? 0,
    rewinds: user.wallet?.rewinds ?? 0,
    doubleDowns: user.wallet?.doubleDowns ?? 0,
  };

  return (
    <SwipeDeck
      initialCandidates={candidates}
      initialBudget={budget}
      initialWallet={wallet}
    />
  );
}
