import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      leads: {
        select: {
          id: true,
          name: true,
          status: true,
          campaignStage: true,
          source: true,
        },
        take: 50,
      },
      _count: { select: { leads: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.leadSource !== undefined && { leadSource: body.leadSource }),
        ...(body.triggerStatus !== undefined && {
          triggerStatus: body.triggerStatus,
        }),
        ...(body.stopConditions !== undefined && {
          stopConditions: body.stopConditions,
        }),
      },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
    });

    return NextResponse.json(campaign);
  } catch (err) {
    console.error("[PATCH /api/campaigns/:id]", err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Unenroll all leads before deleting
  await db.lead.updateMany({
    where: { campaignId: id },
    data: { campaignId: null, campaignStage: 0 },
  });

  await db.campaign.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
