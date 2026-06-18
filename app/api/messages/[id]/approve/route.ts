import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { approveAndSendMessage } from "@/lib/communications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await approveAndSendMessage(id, "admin");

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
