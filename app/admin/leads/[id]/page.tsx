import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import LeadDetailClient from "@/components/admin/LeadDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      campaign: {
        include: {
          steps: { where: { isActive: true }, orderBy: { stepNumber: "asc" } },
        },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      messages: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!lead) notFound();

  const campaigns = await db.campaign.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  return <LeadDetailClient lead={lead} campaigns={campaigns} />;
}
