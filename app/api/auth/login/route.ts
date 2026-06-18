import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password: string };

    if (!env.adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured. Set ADMIN_PASSWORD in your environment." },
        { status: 500 }
      );
    }

    if (password !== env.adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
