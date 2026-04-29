import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSwipeBudget } from "@/lib/swipe";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  const budget = await getSwipeBudget(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      profileComplete: user.profile?.isComplete ?? false,
      wallet: user.wallet,
    },
    budget,
  });
}
