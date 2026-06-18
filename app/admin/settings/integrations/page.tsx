import { env } from "@/lib/env";
import IntegrationsClient from "@/components/admin/IntegrationsClient";

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  const integrationStatus = {
    followUpBoss: {
      configured: !!env.fubApiKey,
      hasXSystem: !!env.fubXSystem,
    },
    openai: {
      configured: !!env.openaiApiKey,
      model: env.openaiModel,
    },
    twilio: {
      configured: !!(env.twilioAccountSid && env.twilioAuthToken && env.twilioPhone),
    },
    resend: {
      configured: !!env.resendApiKey,
    },
    meta: {
      configured: !!(env.metaAppId && env.metaAccessToken),
      hasAdAccount: !!env.metaAdAccountId,
      hasPageId: !!env.metaPageId,
    },
    sendMode: env.sendMode,
  };

  return <IntegrationsClient status={integrationStatus} />;
}
