import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { summarizeLead, generateFirstResponse } from "@/lib/aiAgent";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = body.action as string;

  if (action === "summarize") {
    const result = await summarizeLead(id);
    return NextResponse.json(result);
  }

  if (action === "generate_sms") {
    const result = await generateFirstResponse(id, "sms");
    return NextResponse.json(result);
  }

  if (action === "generate_email") {
    const result = await generateFirstResponse(id, "email");
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
