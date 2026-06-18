/**
 * Validated server-side environment variables.
 * Call validateEnv() on startup to surface missing vars early.
 * Never import this file in client components.
 */

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. Add it to your .env.local file.`
    );
  }
  return value;
}

export function getOptionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function getBoolEnv(key: string, fallback = false): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === "true" || val === "1";
}

export function validateEnv(): void {
  const required = ["DATABASE_URL", "OPENAI_API_KEY", "ADMIN_PASSWORD"];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    console.error(
      `[ENV] Missing required environment variables: ${missing.join(", ")}`
    );
  } else {
    console.log("[ENV] All required environment variables are present.");
  }
}

export const env = {
  // App
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: getOptionalEnv("NEXTAUTH_URL", "http://localhost:3000"),

  // Admin Auth
  adminEmail: getOptionalEnv("ADMIN_EMAIL", "admin@example.com"),
  adminPassword: getOptionalEnv("ADMIN_PASSWORD", ""),
  sessionSecret: getOptionalEnv(
    "SESSION_SECRET",
    "change-me-in-production-32chars-min"
  ),

  // OpenAI
  openaiApiKey: getOptionalEnv("OPENAI_API_KEY"),
  openaiModel: getOptionalEnv("OPENAI_MODEL", "gpt-4o-mini"),
  useMockOpenAI: getBoolEnv("USE_MOCK_OPENAI"),

  // Follow Up Boss
  fubApiKey: getOptionalEnv("FOLLOW_UP_BOSS_API_KEY"),
  fubXSystem: getOptionalEnv("FOLLOW_UP_BOSS_X_SYSTEM"),
  fubXSystemKey: getOptionalEnv("FOLLOW_UP_BOSS_X_SYSTEM_KEY"),

  // Twilio
  twilioAccountSid: getOptionalEnv("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: getOptionalEnv("TWILIO_AUTH_TOKEN"),
  twilioPhone: getOptionalEnv("TWILIO_PHONE_NUMBER"),

  // Resend
  resendApiKey: getOptionalEnv("RESEND_API_KEY"),
  emailFromAddress: getOptionalEnv("EMAIL_FROM_ADDRESS", "noreply@example.com"),

  // Sending mode: "disabled" | "manual_approval" | "auto_send"
  sendMode: getOptionalEnv("SEND_MODE", "disabled"),

  // Meta / Facebook / Instagram
  metaAppId: getOptionalEnv("META_APP_ID"),
  metaAppSecret: getOptionalEnv("META_APP_SECRET"),
  metaAccessToken: getOptionalEnv("META_ACCESS_TOKEN"),
  metaAdAccountId: getOptionalEnv("META_AD_ACCOUNT_ID"),
  metaPageId: getOptionalEnv("META_PAGE_ID"),
  metaIgBusinessId: getOptionalEnv("META_IG_BUSINESS_ID"),
  metaWebhookVerifyToken: getOptionalEnv("META_WEBHOOK_VERIFY_TOKEN"),
  metaApiVersion: getOptionalEnv("META_API_VERSION", "v19.0"),

  // Cron secret (for securing /api/cron/* routes)
  cronSecret: getOptionalEnv("CRON_SECRET"),

  // BoldTrail / MAXTech
  maxtechApiBase: getOptionalEnv("MAXTECH_API_BASE_URL"),
  maxtechApiKey: getOptionalEnv("MAXTECH_API_KEY"),
};
