import { NextResponse } from "next/server";
import { generateRealEstateCampaign } from "@/lib/openai";
import { validateCampaignFormValues } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateCampaignFormValues(body);

    if (!validation.ok || !validation.values) {
      return NextResponse.json(
        {
          error: validation.issues.join(" ")
        },
        { status: 400 }
      );
    }

    const result = await generateRealEstateCampaign(validation.values);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while generating the campaign.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
