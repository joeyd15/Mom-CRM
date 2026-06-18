import { describe, expect, it } from "vitest";
import { sampleCampaignFormValues } from "@/lib/constants";
import { suggestCampaignSelection } from "@/lib/campaignSelector";

describe("suggestCampaignSelection", () => {
  it("prioritizes Zillow new leads for speed-to-contact", () => {
    const suggestion = suggestCampaignSelection(sampleCampaignFormValues);

    expect(suggestion.templateName).toBe("Zillow New Lead Speed-To-Contact");
    expect(suggestion.priority).toBe("High");
    expect(suggestion.recommendedStage).toBe("Prospect");
  });

  it("routes past clients to a past client template", () => {
    const suggestion = suggestCampaignSelection({
      ...sampleCampaignFormValues,
      leadType: "Past Client",
      leadStage: "Past Client",
      campaignGoal: "Re-engage"
    });

    expect(suggestion.templateName).toBe("Past Client Re-Engagement");
    expect(suggestion.recommendedStage).toBe("Past Client");
  });
});
