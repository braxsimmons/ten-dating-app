import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCandidates } from "@/lib/feed";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const candidates = await getCandidates(user.id);
  return NextResponse.json({ candidates });
}
