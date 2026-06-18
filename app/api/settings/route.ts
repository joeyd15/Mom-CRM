import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await db.settings.findUnique({ where: { id: "singleton" } });

  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: "singleton",
        agentEnabled: true,
        autoClassify: true,
        autoCampaign: true,
        messageGen: true,
        sendMode: "disabled",
        maxMsgPerDay: 3,
        businessHoursOnly: true,
        businessHoursStart: 9,
        businessHoursEnd: 17,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const settings = await db.settings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        agentEnabled: body.agentEnabled ?? true,
        autoClassify: body.autoClassify ?? true,
        autoCampaign: body.autoCampaign ?? true,
        messageGen: body.messageGen ?? true,
        sendMode: body.sendMode ?? "disabled",
        maxMsgPerDay: body.maxMsgPerDay ?? 3,
        businessHoursOnly: body.businessHoursOnly ?? true,
        businessHoursStart: body.businessHoursStart ?? 9,
        businessHoursEnd: body.businessHoursEnd ?? 17,
        handoffRules: body.handoffRules ?? null,
        priorityRules: body.priorityRules ?? null,
      },
      update: {
        ...(body.agentEnabled !== undefined && { agentEnabled: body.agentEnabled }),
        ...(body.autoClassify !== undefined && { autoClassify: body.autoClassify }),
        ...(body.autoCampaign !== undefined && { autoCampaign: body.autoCampaign }),
        ...(body.messageGen !== undefined && { messageGen: body.messageGen }),
        ...(body.sendMode !== undefined && { sendMode: body.sendMode }),
        ...(body.maxMsgPerDay !== undefined && { maxMsgPerDay: body.maxMsgPerDay }),
        ...(body.businessHoursOnly !== undefined && {
          businessHoursOnly: body.businessHoursOnly,
        }),
        ...(body.businessHoursStart !== undefined && {
          businessHoursStart: body.businessHoursStart,
        }),
        ...(body.businessHoursEnd !== undefined && {
          businessHoursEnd: body.businessHoursEnd,
        }),
        ...(body.handoffRules !== undefined && { handoffRules: body.handoffRules }),
        ...(body.priorityRules !== undefined && { priorityRules: body.priorityRules }),
      },
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
