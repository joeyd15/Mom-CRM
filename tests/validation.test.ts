import { describe, expect, it } from "vitest";
import { sampleCampaignFormValues } from "@/lib/constants";
import { validateCampaignFormValues } from "@/lib/validation";

describe("validateCampaignFormValues", () => {
  it("accepts a complete campaign form payload", () => {
    const result = validateCampaignFormValues(sampleCampaignFormValues);

    expect(result.ok).toBe(true);
    expect(result.values?.leadSource).toBe("Zillow");
  });

  it("rejects missing required fields", () => {
    const result = validateCampaignFormValues({
      ...sampleCampaignFormValues,
      agentName: "",
      cityMarket: ""
    });

    expect(result.ok).toBe(false);
    expect(result.issues).toContain("Agent name is required.");
    expect(result.issues).toContain("City/market is required.");
  });

  it("rejects invalid enum values", () => {
    const result = validateCampaignFormValues({
      ...sampleCampaignFormValues,
      leadType: "Tenant"
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.startsWith("Lead type must be one of"))).toBe(true);
  });
});
