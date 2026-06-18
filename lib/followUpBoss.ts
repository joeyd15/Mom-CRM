/**
 * Follow Up Boss API Service
 *
 * Handles all communication with the Follow Up Boss API.
 * Leads come in through FUB (which receives them from Zillow via integration).
 * We never call Zillow directly — FUB is the source of truth for Zillow leads.
 *
 * Docs: https://followupboss.com/api/v1/
 */

import { env } from "./env";

const FUB_BASE_URL = "https://api.followupboss.com/v1";

// Sources we treat as Zillow-origin leads
export const ZILLOW_SOURCES = [
  "Zillow",
  "Zillow Premier Agent",
  "Trulia",
  "Realtor.com",
  "Realtor",
  "HotPads",
  "StreetEasy",
  "Apartments.com",
  "Zillow Rental",
];

export interface FubPerson {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  emails?: { value: string; type: string }[];
  phones?: { value: string; type: string }[];
  source?: string;
  sourceUrl?: string;
  stage?: string;
  assignedTo?: string;
  assignedLenderName?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, string>;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  price?: string;
  created?: string;
  updated?: string;
  lastActivity?: string;
  inquiryText?: string;
}

export interface FubPeopleResponse {
  people: FubPerson[];
  _metadata?: {
    total: number;
    page: number;
    pageSize: number;
    nextPage?: number;
  };
}

export interface FubEvent {
  id: number;
  type: string;
  personId: number;
  created: string;
  message?: string;
  source?: string;
}

function buildHeaders(): Record<string, string> {
  if (!env.fubApiKey) {
    throw new Error(
      "FOLLOW_UP_BOSS_API_KEY is not set. Add it to your .env.local file."
    );
  }

  // FUB uses HTTP Basic Auth: API key as username, empty password
  const credentials = Buffer.from(`${env.fubApiKey}:`).toString("base64");

  const headers: Record<string, string> = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (env.fubXSystem) {
    headers["X-System"] = env.fubXSystem;
  }
  if (env.fubXSystemKey) {
    headers["X-System-Key"] = env.fubXSystemKey;
  }

  return headers;
}

async function fubFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FUB_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Follow Up Boss API error ${response.status} for ${path}: ${text}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch all people (leads) from Follow Up Boss with pagination.
 */
export async function fetchAllPeople(
  limit = 100,
  offset = 0
): Promise<FubPeopleResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: "created",
    direction: "desc",
  });

  return fubFetch<FubPeopleResponse>(`/people?${params.toString()}`);
}

/**
 * Fetch a single person by ID.
 */
export async function fetchPersonById(id: number): Promise<FubPerson> {
  return fubFetch<FubPerson>(`/people/${id}`);
}

/**
 * Fetch events (activity) for a person.
 */
export async function fetchPersonEvents(personId: number): Promise<FubEvent[]> {
  const data = await fubFetch<{ events: FubEvent[] }>(
    `/events?personId=${personId}`
  );
  return data.events ?? [];
}

/**
 * Fetch only leads from known Zillow sources.
 */
export async function fetchZillowLeads(
  limit = 100,
  offset = 0
): Promise<FubPeopleResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: "created",
    direction: "desc",
  });

  // FUB supports filtering by source
  for (const source of ZILLOW_SOURCES) {
    params.append("source[]", source);
  }

  return fubFetch<FubPeopleResponse>(`/people?${params.toString()}`);
}

/**
 * Fetch all people updated since a given date.
 */
export async function fetchPeopleSince(
  since: Date,
  limit = 100,
  offset = 0
): Promise<FubPeopleResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: "updated",
    direction: "desc",
    updatedSince: since.toISOString(),
  });

  return fubFetch<FubPeopleResponse>(`/people?${params.toString()}`);
}

/**
 * Determine if a FUB person is a Zillow lead based on source, tags, or metadata.
 */
export function isZillowLead(person: FubPerson): boolean {
  const source = (person.source ?? "").toLowerCase();

  const zillowKeywords = [
    "zillow",
    "trulia",
    "realtor.com",
    "hotpads",
    "streeteasy",
    "apartments.com",
  ];

  if (zillowKeywords.some((kw) => source.includes(kw))) return true;

  const tags = person.tags ?? [];
  if (
    tags.some((tag) =>
      zillowKeywords.some((kw) => tag.toLowerCase().includes(kw))
    )
  )
    return true;

  if (
    person.sourceUrl &&
    zillowKeywords.some((kw) => person.sourceUrl!.toLowerCase().includes(kw))
  )
    return true;

  return false;
}

/**
 * Extract the best email from a FUB person.
 */
export function extractEmail(person: FubPerson): string | null {
  if (!person.emails || person.emails.length === 0) return null;
  const primary = person.emails.find((e) => e.type === "primary");
  return primary ? primary.value : person.emails[0].value;
}

/**
 * Extract the best phone from a FUB person.
 */
export function extractPhone(person: FubPerson): string | null {
  if (!person.phones || person.phones.length === 0) return null;
  const mobile = person.phones.find((e) => e.type === "mobile");
  return mobile ? mobile.value : person.phones[0].value;
}

/**
 * Map a FUB person to a flat lead object for our database.
 */
export function mapFubPersonToLead(person: FubPerson) {
  return {
    followUpBossId: String(person.id),
    source: person.source ?? "Follow Up Boss",
    name: person.name ?? "Unknown",
    email: extractEmail(person),
    phone: extractPhone(person),
    propertyAddress: [person.propertyCity, person.propertyState]
      .filter(Boolean)
      .join(", ") || null,
    inquiryMessage: person.inquiryText ?? person.notes ?? null,
    status: mapFubStageToStatus(person.stage),
    assignedAgent: person.assignedTo ?? null,
    rawFubData: person as unknown as Record<string, unknown>,
  };
}

/**
 * Map FUB stage names to our internal lead status values.
 */
function mapFubStageToStatus(stage?: string): string {
  if (!stage) return "New Lead";
  const s = stage.toLowerCase();

  if (s.includes("new") || s.includes("inquiry")) return "New Lead";
  if (s.includes("contact")) return "Contacted";
  if (s.includes("prospect")) return "Prospect";
  if (s.includes("showing")) return "Showing Scheduled";
  if (s.includes("active") || s.includes("client")) return "Active Client";
  if (s.includes("nurture") || s.includes("long")) return "Nurture";
  if (s.includes("closed") || s.includes("won")) return "Closed";
  if (s.includes("lost") || s.includes("dead")) return "Lost";
  if (s.includes("do not") || s.includes("dnc")) return "Do Not Contact";

  return "New Lead";
}

/**
 * Test connection to Follow Up Boss — returns account info.
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  accountName?: string;
}> {
  try {
    const data = await fubFetch<{ account?: { name?: string } }>("/account");
    return {
      success: true,
      message: "Connected to Follow Up Boss successfully.",
      accountName: data.account?.name,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
