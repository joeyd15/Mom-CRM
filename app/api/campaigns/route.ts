import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      steps: { where: { isActive: true }, orderBy: { stepNumber: "asc" } },
      _count: { select: { leads: true } },
    },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const campaign = await db.campaign.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        isActive: body.isActive ?? false,
        leadSource: body.leadSource ?? null,
        triggerStatus: body.triggerStatus ?? null,
        stopConditions: body.stopConditions ?? null,
        steps: body.steps
          ? {
              create: body.steps.map(
                (
                  step: {
                    stepNumber: number;
                    channel: string;
                    delayHours?: number;
                    subject?: string;
                    body: string;
                  },
                  index: number
                ) => ({
                  stepNumber: step.stepNumber ?? index,
                  channel: step.channel,
                  delayHours: step.delayHours ?? 0,
                  subject: step.subject ?? null,
                  body: step.body,
                })
              ),
            }
          : undefined,
      },
      include: { steps: true },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[POST /api/campaigns]", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
