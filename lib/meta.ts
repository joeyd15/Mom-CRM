/**
 * Meta / Facebook / Instagram Marketing Integration
 *
 * IMPORTANT: Real estate ads require Special Ad Category = HOUSING.
 * All campaigns must be reviewed and approved by admin before launch.
 * Never create discriminatory targeting.
 *
 * This module provides the foundation for Meta integration.
 * Actual API calls are stubbed until Meta credentials are configured.
 */

import { env } from "./env";

const META_API_BASE = `https://graph.facebook.com/${env.metaApiVersion}`;

export interface MetaAdCampaign {
  name: string;
  objective: string;
  special_ad_categories: string[];
  status: "PAUSED" | "ACTIVE";
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSet {
  name: string;
  campaign_id: string;
  billing_event: "IMPRESSIONS" | "LINK_CLICKS";
  optimization_goal: string;
  bid_amount?: number;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting: MetaTargeting;
  start_time?: string;
  end_time?: string;
}

export interface MetaTargeting {
  age_min?: number;
  age_max?: number;
  geo_locations?: {
    cities?: { key: string; name: string }[];
    zips?: { key: string }[];
  };
  // NOTE: For housing ads, demographic targeting is restricted
  // Do NOT add gender, race, religion, or national origin targeting
}

export interface MetaAdCreative {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data?: {
      link: string;
      message: string;
      name: string;
      description?: string;
      image_hash?: string;
    };
  };
}

// ─── Connection & Auth ──────────────────────────────────────────────────────

export function isMetaConfigured(): boolean {
  return !!(
    env.metaAppId &&
    env.metaAppSecret &&
    env.metaAccessToken &&
    env.metaAdAccountId
  );
}

async function metaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isMetaConfigured()) {
    throw new Error(
      "Meta credentials not configured. Set META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN, and META_AD_ACCOUNT_ID in your environment variables."
    );
  }

  const url = `${META_API_BASE}${path}`;
  const separator = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${separator}access_token=${env.metaAccessToken}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: {} }));
    throw new Error(
      `Meta API error ${response.status}: ${JSON.stringify(error)}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── Facebook Pages ─────────────────────────────────────────────────────────

export async function listFacebookPages(): Promise<
  { id: string; name: string; access_token: string }[]
> {
  const data = await metaFetch<{
    data: { id: string; name: string; access_token: string }[];
  }>("/me/accounts");
  return data.data ?? [];
}

// ─── Instagram ──────────────────────────────────────────────────────────────

export async function getInstagramAccount(
  pageId: string
): Promise<{ id: string; username: string; name: string } | null> {
  try {
    const data = await metaFetch<{
      instagram_business_account?: { id: string; username: string; name: string };
    }>(`/${pageId}?fields=instagram_business_account`);
    return data.instagram_business_account ?? null;
  } catch {
    return null;
  }
}

// ─── Ad Campaigns (ADMIN APPROVAL REQUIRED) ─────────────────────────────────

/**
 * Create a Meta ad campaign draft in our database.
 * Does NOT call the Meta API — requires admin approval before launch.
 */
export async function createCampaignDraft(data: {
  name: string;
  objective: string;
  budget: number;
  budgetType: "daily" | "lifetime";
  startDate?: Date;
  endDate?: Date;
  audience?: MetaTargeting;
  creative?: Partial<MetaAdCreative>;
  notes?: string;
}) {
  const { db } = await import("./db");

  return db.metaCampaignDraft.create({
    data: {
      name: data.name,
      objective: data.objective,
      specialAdCategory: "HOUSING",
      budget: data.budget,
      budgetType: data.budgetType,
      startDate: data.startDate,
      endDate: data.endDate,
      audience: data.audience as Parameters<
        typeof db.metaCampaignDraft.create
      >[0]["data"]["audience"],
      creative: data.creative as Parameters<
        typeof db.metaCampaignDraft.create
      >[0]["data"]["creative"],
      notes: data.notes,
      status: "draft",
    },
  });
}

/**
 * Launch a pre-approved campaign draft to Meta.
 * Only works on drafts with status = "approved".
 */
export async function launchApprovedCampaign(draftId: string): Promise<{
  success: boolean;
  metaCampaignId?: string;
  error?: string;
}> {
  const { db } = await import("./db");

  const draft = await db.metaCampaignDraft.findUnique({
    where: { id: draftId },
  });

  if (!draft) return { success: false, error: "Draft not found" };
  if (draft.status !== "approved") {
    return {
      success: false,
      error: "Campaign must be approved by admin before launch",
    };
  }

  if (!isMetaConfigured()) {
    return { success: false, error: "Meta credentials not configured" };
  }

  try {
    const campaign: MetaAdCampaign = {
      name: draft.name,
      objective: draft.objective,
      special_ad_categories: [draft.specialAdCategory],
      status: "PAUSED", // Always start paused — admin must activate
      ...(draft.startDate && { start_time: draft.startDate.toISOString() }),
      ...(draft.endDate && { stop_time: draft.endDate.toISOString() }),
    };

    const result = await metaFetch<{ id: string }>(
      `/act_${env.metaAdAccountId}/campaigns`,
      {
        method: "POST",
        body: JSON.stringify(campaign),
      }
    );

    await db.metaCampaignDraft.update({
      where: { id: draftId },
      data: {
        status: "launched",
        metaCampaignId: result.id,
      },
    });

    return { success: true, metaCampaignId: result.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

// ─── Webhook Verification ────────────────────────────────────────────────────

export function verifyMetaWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (
    mode === "subscribe" &&
    token === env.metaWebhookVerifyToken &&
    env.metaWebhookVerifyToken
  ) {
    return challenge;
  }
  return null;
}

// ─── Lead Forms ──────────────────────────────────────────────────────────────

export interface MetaLeadFormEntry {
  id: string;
  created_time: string;
  field_data: { name: string; values: string[] }[];
  ad_id?: string;
  form_id?: string;
  page_id?: string;
}

export function parseMetaLeadEntry(entry: MetaLeadFormEntry): {
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  rawData: unknown;
} {
  const fields: Record<string, string> = {};
  for (const field of entry.field_data) {
    fields[field.name.toLowerCase()] = field.values[0] ?? "";
  }

  const firstName = fields["first_name"] ?? fields["firstname"] ?? "";
  const lastName = fields["last_name"] ?? fields["lastname"] ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

  return {
    name: fullName,
    email: fields["email"] ?? null,
    phone: fields["phone_number"] ?? fields["phone"] ?? null,
    source: "Facebook Lead Form",
    rawData: entry,
  };
}

// ─── Ad Performance ──────────────────────────────────────────────────────────

export async function getCampaignInsights(
  metaCampaignId: string,
  dateRange = "last_30d"
): Promise<Record<string, unknown> | null> {
  try {
    const data = await metaFetch<{ data: unknown[] }>(
      `/${metaCampaignId}/insights?date_preset=${dateRange}&fields=impressions,clicks,spend,cpc,cpm,reach,actions`
    );
    return { insights: data.data };
  } catch {
    return null;
  }
}
