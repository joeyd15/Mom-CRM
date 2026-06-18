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

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      campaign: {
        include: {
          steps: { where: { isActive: true }, orderBy: { stepNumber: "asc" } },
        },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
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

    // Track status changes
    const existing = await db.lead.findUnique({ where: { id } });
    if (existing && body.status && body.status !== existing.status) {
      await db.activity.create({
        data: {
          leadId: id,
          type: "status_change",
          title: `Status changed: ${existing.status} → ${body.status}`,
          metadata: { from: existing.status, to: body.status },
        },
      });
    }

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.assignedAgent !== undefined && {
          assignedAgent: body.assignedAgent,
        }),
        ...(body.nextFollowUpAt !== undefined && {
          nextFollowUpAt: new Date(body.nextFollowUpAt),
        }),
        ...(body.lastContactedAt !== undefined && {
          lastContactedAt: new Date(body.lastContactedAt),
        }),
        ...(body.campaignId !== undefined && { campaignId: body.campaignId }),
        ...(body.doNotContact !== undefined && {
          doNotContact: body.doNotContact,
        }),
        ...(body.optedOut !== undefined && { optedOut: body.optedOut }),
        ...(body.propertyAddress !== undefined && {
          propertyAddress: body.propertyAddress,
        }),
        ...(body.inquiryMessage !== undefined && {
          inquiryMessage: body.inquiryMessage,
        }),
      },
    });

    return NextResponse.json(lead);
  } catch (err) {
    console.error("[PATCH /api/leads/:id]", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
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

  // Soft delete — mark as Lost instead of deleting data
  await db.lead.update({
    where: { id },
    data: { status: "Lost" },
  });

  await db.activity.create({
    data: {
      leadId: id,
      type: "status_change",
      title: "Lead archived (status set to Lost)",
      metadata: { action: "soft_delete" },
    },
  });

  return NextResponse.json({ success: true });
}
