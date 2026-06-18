import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import CampaignEditor from "@/components/admin/CampaignEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      _count: { select: { leads: true } },
    },
  });

  if (!campaign) notFound();

  return <CampaignEditor campaign={campaign} />;
}
