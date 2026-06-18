import { db } from "@/lib/db";
import AgentSettingsClient from "@/components/admin/AgentSettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = await db.settings.findUnique({ where: { id: "singleton" } });

  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: "singleton",
        agentEnabled: true,
        autoClassify: true,
        autoCampaign: true,
        messageGen: true,
        sendMode: "disabled",
        maxMsgPerDay: 3,
        businessHoursOnly: true,
        businessHoursStart: 9,
        businessHoursEnd: 17,
      },
    });
  }

  return <AgentSettingsClient settings={settings} />;
}
