"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface IntegrationStatus {
  followUpBoss: { configured: boolean; hasXSystem: boolean };
  openai: { configured: boolean; model: string };
  twilio: { configured: boolean };
  resend: { configured: boolean };
  meta: { configured: boolean; hasAdAccount: boolean; hasPageId: boolean };
  sendMode: string;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-600" />
      )}
      <span className={`text-sm ${ok ? "text-green-400" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

function EnvRow({
  name,
  description,
  configured,
  example,
}: {
  name: string;
  description: string;
  configured: boolean;
  example?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <code
          className={`text-sm font-mono ${
            configured ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {name}
        </code>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        {!configured && example && (
          <p className="text-xs text-slate-600 mt-0.5 font-mono">{example}</p>
        )}
      </div>
      <div className="shrink-0">
        {configured ? (
          <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full border border-green-700/40">
            ✓ Set
          </span>
        ) : (
          <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-700/40">
            Missing
          </span>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsClient({
  status,
}: {
  status: IntegrationStatus;
}) {
  const [testingFub, setTestingFub] = useState(false);
  const [fubTestResult, setFubTestResult] = useState<string | null>(null);

  async function testFubConnection() {
    setTestingFub(true);
    setFubTestResult(null);
    try {
      const res = await fetch("/api/sync/follow-up-boss", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFubTestResult(
          `✓ Connected! Found ${data.leadsFound} leads. Added: ${data.leadsAdded}, Updated: ${data.leadsUpdated}`
        );
      } else {
        setFubTestResult(`✗ ${data.error}`);
      }
    } catch {
      setFubTestResult("✗ Network error");
    } finally {
      setTestingFub(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Configure connections to external services. All keys are set as
          environment variables — never stored in the database.
        </p>
      </div>

      {/* Follow Up Boss */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏡</span>
            <div>
              <h2 className="font-semibold text-white">Follow Up Boss</h2>
              <p className="text-xs text-slate-400">
                Source of truth for Zillow leads
              </p>
            </div>
          </div>
          <StatusBadge
            ok={status.followUpBoss.configured}
            label={status.followUpBoss.configured ? "Connected" : "Not connected"}
          />
        </div>

        <div className="space-y-0 mb-4">
          <EnvRow
            name="FOLLOW_UP_BOSS_API_KEY"
            description="Your Follow Up Boss API key"
            configured={status.followUpBoss.configured}
            example="fub_live_xxxxxxxxxxxx"
          />
          <EnvRow
            name="FOLLOW_UP_BOSS_X_SYSTEM"
            description="X-System header (optional, for partner integrations)"
            configured={status.followUpBoss.hasXSystem}
            example="YourSystemName"
          />
          <EnvRow
            name="FOLLOW_UP_BOSS_X_SYSTEM_KEY"
            description="X-System-Key header (optional)"
            configured={false}
            example="your-system-key"
          />
        </div>

        {status.followUpBoss.configured && (
          <div>
            <button
              onClick={testFubConnection}
              disabled={testingFub}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm rounded-xl"
            >
              {testingFub ? "Testing..." : "Test Connection & Sync"}
            </button>
            {fubTestResult && (
              <p
                className={`text-sm mt-2 ${
                  fubTestResult.startsWith("✓")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {fubTestResult}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 font-medium mb-2">
            📋 How to get your Follow Up Boss API key:
          </p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Log in to Follow Up Boss</li>
            <li>Go to Admin → API → Create API Key</li>
            <li>Copy the key and add it to your .env.local as FOLLOW_UP_BOSS_API_KEY</li>
            <li>
              Zillow leads come through automatically — do NOT need a separate Zillow
              API key
            </li>
          </ol>
        </div>

        <div className="mt-3 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 font-medium mb-1">
            🔗 Webhook URL (set this in Follow Up Boss):
          </p>
          <code className="text-xs text-blue-300 break-all">
            https://your-domain.com/api/webhooks/follow-up-boss
          </code>
        </div>
      </div>

      {/* OpenAI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="font-semibold text-white">OpenAI</h2>
              <p className="text-xs text-slate-400">AI lead analysis & messaging</p>
            </div>
          </div>
          <StatusBadge ok={status.openai.configured} label={status.openai.configured ? `Model: ${status.openai.model}` : "Not configured"} />
        </div>
        <EnvRow
          name="OPENAI_API_KEY"
          description="Your OpenAI API key"
          configured={status.openai.configured}
          example="sk-..."
        />
        <EnvRow
          name="OPENAI_MODEL"
          description="Model to use (default: gpt-4o-mini)"
          configured={true}
          example="gpt-4o-mini"
        />
      </div>

      {/* Twilio */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="font-semibold text-white">Twilio SMS</h2>
              <p className="text-xs text-slate-400">
                Text message delivery · Currently: {status.sendMode}
              </p>
            </div>
          </div>
          <StatusBadge
            ok={status.twilio.configured}
            label={status.twilio.configured ? "Configured" : "Not configured"}
          />
        </div>
        <div className="space-y-0">
          <EnvRow name="TWILIO_ACCOUNT_SID" description="Twilio Account SID" configured={status.twilio.configured} example="ACxxxxxxxxxx" />
          <EnvRow name="TWILIO_AUTH_TOKEN" description="Twilio Auth Token" configured={status.twilio.configured} example="your-auth-token" />
          <EnvRow name="TWILIO_PHONE_NUMBER" description="Your Twilio phone number" configured={status.twilio.configured} example="+15551234567" />
        </div>
        <div className="mt-3 p-3 bg-blue-900/10 border border-blue-700/20 rounded-xl">
          <p className="text-xs text-blue-300">
            💡 SMS sending is controlled by <strong>SEND_MODE</strong>. Currently:{" "}
            <strong>{status.sendMode}</strong>. Change in Agent Settings.
          </p>
        </div>
      </div>

      {/* Resend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <h2 className="font-semibold text-white">Resend Email</h2>
              <p className="text-xs text-slate-400">Email delivery service</p>
            </div>
          </div>
          <StatusBadge
            ok={status.resend.configured}
            label={status.resend.configured ? "Configured" : "Not configured"}
          />
        </div>
        <EnvRow name="RESEND_API_KEY" description="Your Resend API key" configured={status.resend.configured} example="re_xxxxxxxxxxxx" />
        <EnvRow name="EMAIL_FROM_ADDRESS" description="From address for outgoing emails" configured={false} example="agent@yourdomain.com" />
      </div>

      {/* Meta */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📘</span>
            <div>
              <h2 className="font-semibold text-white">
                Meta (Facebook / Instagram)
              </h2>
              <p className="text-xs text-slate-400">
                Ad campaigns & lead forms · Requires admin approval before launch
              </p>
            </div>
          </div>
          <StatusBadge
            ok={status.meta.configured}
            label={status.meta.configured ? "Configured" : "Not configured"}
          />
        </div>

        <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">
            <strong>Important:</strong> Real estate ads on Meta require{" "}
            <strong>Special Ad Category = HOUSING</strong>. This restricts
            certain demographic targeting to comply with fair housing laws. All
            campaigns must be reviewed and approved before launch.
          </p>
        </div>

        <div className="space-y-0">
          <EnvRow name="META_APP_ID" description="Meta App ID from Developer Console" configured={status.meta.configured} />
          <EnvRow name="META_APP_SECRET" description="Meta App Secret" configured={status.meta.configured} />
          <EnvRow name="META_ACCESS_TOKEN" description="Long-lived Page Access Token" configured={status.meta.configured} />
          <EnvRow name="META_AD_ACCOUNT_ID" description="Ad Account ID (without act_ prefix)" configured={status.meta.hasAdAccount} example="123456789" />
          <EnvRow name="META_PAGE_ID" description="Facebook Page ID" configured={status.meta.hasPageId} />
          <EnvRow name="META_IG_BUSINESS_ID" description="Instagram Business Account ID" configured={false} />
          <EnvRow name="META_WEBHOOK_VERIFY_TOKEN" description="Random string for webhook verification" configured={false} example="my-random-token-123" />
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 font-medium mb-2">
            📋 How to set up Meta integration:
          </p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Go to developers.facebook.com and create an app</li>
            <li>Add Marketing API product to your app</li>
            <li>Generate a long-lived page access token</li>
            <li>Get your Ad Account ID from business.facebook.com/adsmanager</li>
            <li>Set webhook URL in App Dashboard → Webhooks</li>
          </ol>
        </div>

        <div className="mt-3 p-3 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 font-medium mb-1">
            🔗 Meta Webhook URL:
          </p>
          <code className="text-xs text-blue-300 break-all">
            https://your-domain.com/api/webhooks/meta
          </code>
        </div>
      </div>
    </div>
  );
}
