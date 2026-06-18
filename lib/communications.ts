/**
 * Communications Service — SMS and Email
 *
 * IMPORTANT: Actual sending is DISABLED by default.
 * Set SEND_MODE=auto_send in .env to enable automatic sending.
 * Set SEND_MODE=manual_approval to queue messages for admin review.
 *
 * All messages are always logged before any attempt to send.
 */

import { db } from "./db";
import { env } from "./env";

export type SendMode = "disabled" | "manual_approval" | "auto_send";

function getSendMode(): SendMode {
  const mode = env.sendMode;
  if (mode === "manual_approval" || mode === "auto_send") return mode;
  return "disabled";
}

function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  // Default 9am–5pm local server time
  return hour >= 9 && hour < 17;
}

// ─── SMS via Twilio ─────────────────────────────────────────────────────────

export async function sendSms(
  messageId: string,
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const mode = getSendMode();

  // Always log the attempt
  console.log(`[SMS] Mode=${mode} To=${to} Body="${body.slice(0, 60)}..."`);

  if (mode === "disabled") {
    await updateMessageStatus(messageId, "pending", undefined, "Send mode is disabled");
    return { success: false, error: "Send mode is disabled" };
  }

  if (mode === "manual_approval") {
    await updateMessageStatus(messageId, "pending");
    return { success: false, error: "Awaiting manual approval" };
  }

  // auto_send — actually send via Twilio
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioPhone) {
    const err = "Twilio credentials not configured";
    await updateMessageStatus(messageId, "failed", undefined, err);
    return { success: false, error: err };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(env.twilioAccountSid, env.twilioAuthToken);

    const message = await client.messages.create({
      body,
      from: env.twilioPhone,
      to,
    });

    await updateMessageStatus(messageId, "sent", new Date(), undefined, {
      twilioSid: message.sid,
    });

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[SMS] Twilio send failed:", error);
    await updateMessageStatus(messageId, "failed", undefined, error);
    return { success: false, error };
  }
}

// ─── Email via Resend ───────────────────────────────────────────────────────

export async function sendEmail(
  messageId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const mode = getSendMode();

  console.log(`[Email] Mode=${mode} To=${to} Subject="${subject}"`);

  if (mode === "disabled") {
    await updateMessageStatus(messageId, "pending", undefined, "Send mode is disabled");
    return { success: false, error: "Send mode is disabled" };
  }

  if (mode === "manual_approval") {
    await updateMessageStatus(messageId, "pending");
    return { success: false, error: "Awaiting manual approval" };
  }

  // auto_send — send via Resend
  if (!env.resendApiKey) {
    const err = "Resend API key not configured";
    await updateMessageStatus(messageId, "failed", undefined, err);
    return { success: false, error: err };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(env.resendApiKey);

    const result = await resend.emails.send({
      from: env.emailFromAddress,
      to,
      subject,
      text: body,
    });

    await updateMessageStatus(messageId, "sent", new Date(), undefined, {
      resendId: result.data?.id,
    });

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[Email] Resend send failed:", error);
    await updateMessageStatus(messageId, "failed", undefined, error);
    return { success: false, error };
  }
}

/**
 * Approve and send a pending message.
 */
export async function approveAndSendMessage(
  messageId: string,
  approvedBy = "admin"
): Promise<{ success: boolean; error?: string }> {
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: { lead: true },
  });

  if (!message) return { success: false, error: "Message not found" };
  if (message.status === "sent") return { success: false, error: "Already sent" };
  if (message.lead.optedOut || message.lead.doNotContact) {
    return { success: false, error: "Lead has opted out or is Do Not Contact" };
  }

  await db.message.update({
    where: { id: messageId },
    data: { status: "approved", approvedAt: new Date(), approvedBy },
  });

  if (message.channel === "sms" && message.lead.phone) {
    return sendSms(messageId, message.lead.phone, message.body);
  }

  if (message.channel === "email" && message.lead.email) {
    return sendEmail(
      messageId,
      message.lead.email,
      message.subject ?? "Following up",
      message.body
    );
  }

  return {
    success: false,
    error: `Lead has no ${message.channel === "sms" ? "phone" : "email"}`,
  };
}

/**
 * Process opt-out request for a lead.
 */
export async function handleOptOut(leadId: string, channel: "sms" | "email") {
  await db.lead.update({
    where: { id: leadId },
    data: { optedOut: true },
  });

  await db.activity.create({
    data: {
      leadId,
      type: "opt_out",
      title: `Lead opted out of ${channel} communications`,
      metadata: { channel },
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function updateMessageStatus(
  messageId: string,
  status: string,
  sentAt?: Date,
  error?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.message.update({
      where: { id: messageId },
      data: {
        status,
        sentAt,
        error,
        ...(metadata
          ? {
              metadata: metadata as Parameters<
                typeof db.message.update
              >[0]["data"]["metadata"],
            }
          : {}),
      },
    });
  } catch (e) {
    console.error("[Comms] Failed to update message status:", e);
  }
}

export { getSendMode, isBusinessHours };
