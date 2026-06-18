import { NextResponse } from "next/server";
import {
  buildCampaignDraftFromGeneratedCampaign,
  createCampaignDraft,
  getMaxTechConfigStatus
} from "@/lib/maxtech";
import type { CampaignFormValues, GeneratedCampaign } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      values?: CampaignFormValues;
      campaign?: GeneratedCampaign;
    };

    if (!body.values || !body.campaign) {
      return NextResponse.json(
        {
          error: "Request must include values and campaign."
        },
        { status: 400 }
      );
    }

    const draft = buildCampaignDraftFromGeneratedCampaign({
      values: body.values,
      campaign: body.campaign
    });

    const savedDraft = await createCampaignDraft(draft);

    return NextResponse.json({
      status: getMaxTechConfigStatus(),
      draft: savedDraft,
      note: "Preview only. No live MAXTech/BoldTrail API call is made until lib/maxtech.ts is implemented with real credentials and endpoints."
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to build MAXTech/BoldTrail draft preview."
      },
      { status: 500 }
    );
  }
}
