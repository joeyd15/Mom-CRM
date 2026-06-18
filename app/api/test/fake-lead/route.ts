/**
 * Test endpoint: Generate a fake lead for testing.
 * Only available in non-production environments.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const FAKE_LEADS = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson.test@example.com",
    phone: "+15551234567",
    source: "Zillow",
    status: "New Lead",
    priority: "Hot",
    propertyAddress: "123 Oak Street, Austin, TX",
    inquiryMessage:
      "Hi, I saw this home on Zillow and I'm very interested! We're pre-approved for $450k and looking to move within 60 days. Can we schedule a showing?",
  },
  {
    name: "Michael Chen",
    email: "m.chen.test@example.com",
    phone: "+15559876543",
    source: "Zillow Premier Agent",
    status: "New Lead",
    priority: "High",
    propertyAddress: "456 Maple Ave, Austin, TX",
    inquiryMessage:
      "Interested in 3/2 homes in the $300-350k range. First time buyer. Just starting my search.",
  },
  {
    name: "Jennifer Martinez",
    email: "j.martinez.test@example.com",
    phone: "+15555551234",
    source: "Facebook Lead Form",
    status: "New Lead",
    priority: "Normal",
    propertyAddress: null,
    inquiryMessage:
      "Thinking about selling my home in Round Rock. Would love to know what it's worth.",
  },
  {
    name: "Robert Williams",
    email: "r.williams.test@example.com",
    phone: "+15553334444",
    source: "Referral",
    status: "Prospect",
    priority: "Normal",
    propertyAddress: "Westlake area",
    inquiryMessage: "Friend referred me. Looking for luxury home $700k+.",
  },
];

const SAMPLE_FUB_PAYLOAD = {
  type: "personCreated",
  person: {
    id: 999999,
    name: "Test FUB Lead",
    firstName: "Test",
    lastName: "FUB Lead",
    emails: [{ value: "test.fub@example.com", type: "primary" }],
    phones: [{ value: "+15550001111", type: "mobile" }],
    source: "Zillow Premier Agent",
    stage: "New Lead",
    tags: ["zillow", "buyer"],
    inquiryText: "Test inquiry from Zillow via Follow Up Boss webhook",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
};

const SAMPLE_META_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "123456789",
      changes: [
        {
          field: "leadgen",
          value: {
            leadgen_id: "987654321",
            page_id: "123456789",
            form_id: "111222333",
            ad_id: "444555666",
            created_time: Math.floor(Date.now() / 1000),
            field_data: [
              { name: "first_name", values: ["Test"] },
              { name: "last_name", values: ["Meta Lead"] },
              { name: "email", values: ["test.meta@example.com"] },
              { name: "phone_number", values: ["+15552223333"] },
            ],
          },
        },
      ],
    },
  ],
};

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints disabled in production" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const type = body.type ?? "random";

  if (type === "fub_payload") {
    return NextResponse.json({ payload: SAMPLE_FUB_PAYLOAD });
  }

  if (type === "meta_payload") {
    return NextResponse.json({ payload: SAMPLE_META_PAYLOAD });
  }

  // Create a fake lead in the database
  const template =
    type === "zillow"
      ? FAKE_LEADS[0]
      : type === "facebook"
      ? FAKE_LEADS[2]
      : FAKE_LEADS[Math.floor(Math.random() * FAKE_LEADS.length)];

  const lead = await db.lead.create({
    data: {
      ...template,
      name: `${template.name} [TEST ${Date.now()}]`,
      email: template.email.replace("@", `_${Date.now()}@`),
    },
  });

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "note",
      title: "Test lead created",
      metadata: { source: "test_endpoint", type },
    },
  });

  return NextResponse.json({ success: true, lead });
}

export async function GET() {
  return NextResponse.json({
    samples: {
      fubPayload: SAMPLE_FUB_PAYLOAD,
      metaPayload: SAMPLE_META_PAYLOAD,
      leadTypes: ["random", "zillow", "facebook"],
    },
  });
}
