import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const priority = searchParams.get("priority");
  const campaignId = searchParams.get("campaignId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "25");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (source) where.source = { contains: source, mode: "insensitive" };
  if (priority) where.priority = priority;
  if (campaignId) where.campaignId = campaignId;

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        campaign: { select: { id: true, name: true } },
        _count: { select: { activities: true, messages: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({
    leads,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const lead = await db.lead.create({
      data: {
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        source: body.source ?? "Manual",
        status: body.status ?? "New Lead",
        priority: body.priority ?? "Normal",
        propertyAddress: body.propertyAddress ?? null,
        inquiryMessage: body.inquiryMessage ?? null,
        assignedAgent: body.assignedAgent ?? null,
        notes: body.notes ?? null,
      },
    });

    await db.activity.create({
      data: {
        leadId: lead.id,
        type: "note",
        title: "Lead created manually",
        metadata: { source: "admin" },
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads]", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
