import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { seedDefaultCampaigns } from "@/lib/campaignEngine";

export async function POST() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await seedDefaultCampaigns();
  return NextResponse.json({ success: true, message: "Default campaigns seeded" });
}
