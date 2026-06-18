"use client";

import { AlertTriangle, ClipboardList, Download } from "lucide-react";
import type { ReactNode } from "react";
import {
  buildCampaignFilename,
  downloadTextFile,
  formatCampaignAsMarkdown
} from "@/lib/formatCampaign";
import type { CampaignFormValues, EmailDraft, GeneratedCampaign, SequenceStep, SocialPost } from "@/lib/types";
import ComplianceReport from "./ComplianceReport";
import CopyButton from "./CopyButton";
import MaxTechPreviewButton from "./MaxTechPreviewButton";

interface GeneratedOutputProps {
  campaign: GeneratedCampaign | null;
  isLoading: boolean;
  error: string | null;
  parsed: boolean;
  values?: CampaignFormValues;
  mode?: "openai" | "mock";
  notice?: string | null;
}

export default function GeneratedOutput({
  campaign,
  isLoading,
  error,
  parsed,
  values,
  mode,
  notice
}: GeneratedOutputProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <div className="mb-4 h-5 w-44 animate-pulse rounded bg-ink/10" />
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-ink/10" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-ink/10" />
          <div className="h-4 w-8/12 animate-pulse rounded bg-ink/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-coral/35 bg-white p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-coral" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-ink">Generation error</h2>
            <p className="mt-2 text-sm leading-6 text-ink/75">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-lg border border-dashed border-ink/20 bg-white/70 p-8 text-center">
        <ClipboardList className="mx-auto h-8 w-8 text-evergreen" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold text-ink">Campaign drafts will appear here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/70">
          The output is draft-only and should be reviewed before copying into MAXTech/BoldTrail.
        </p>
      </div>
    );
  }

  if (!parsed && campaign.rawTextFallback) {
    return (
      <Section title="Raw AI Output" copyText={campaign.rawTextFallback}>
        <p className="mb-4 rounded-md bg-coral/10 p-3 text-sm text-ink/80">
          JSON parsing failed, so the raw model response is shown below.
        </p>
        <PreBlock text={campaign.rawTextFallback} />
      </Section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Campaign package ready</p>
            <p className="mt-1 text-xs text-ink/60">
              Generation mode: <span className="font-semibold text-evergreen">{mode || "openai"}</span>
              {notice ? ` - ${notice}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={formatCampaignAsMarkdown(campaign, values)} label="Copy all" />
            <DownloadButton
              label="Markdown"
              onClick={() =>
                downloadTextFile(
                  buildCampaignFilename(values, "md"),
                  formatCampaignAsMarkdown(campaign, values),
                  "text/markdown"
                )
              }
            />
            <DownloadButton
              label="JSON"
              onClick={() =>
                downloadTextFile(
                  buildCampaignFilename(values, "json"),
                  JSON.stringify({ values, campaign }, null, 2),
                  "application/json"
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-evergreen/25 bg-mist p-4 text-sm leading-6 text-ink/80">
        <strong className="text-ink">Draft-only reminder:</strong> {campaign.reviewReminder}
      </div>

      <ComplianceReport campaign={campaign} />

      {values ? <MaxTechPreviewButton values={values} campaign={campaign} /> : null}

      <Section title="Immediate Follow-Up Text" copyText={campaign.immediateFollowUpText}>
        <MessageBlock text={campaign.immediateFollowUpText} />
      </Section>

      <EmailSection title="Immediate Follow-Up Email" email={campaign.immediateFollowUpEmail} />
      <SequenceSection title="7-Day Follow-Up Sequence" steps={campaign.sevenDayFollowUpSequence} />
      <SequenceSection title="30-Day Nurture Sequence" steps={campaign.thirtyDayNurtureSequence} />
      <EmailSection title="Monthly Newsletter" email={campaign.monthlyNewsletter} />
      <SocialSection title="10 Facebook Posts" posts={campaign.facebookPosts} />
      <SocialSection title="10 Instagram Posts" posts={campaign.instagramPosts} />
      <EmailSection title="Market Update Email" email={campaign.marketUpdateEmail} />
      <EmailSection title="Open House Promotion" email={campaign.openHousePromotion} />

      <Section
        title="Suggested MAXTech/BoldTrail Campaign Structure"
        copyText={formatMaxTechSuggestion(campaign)}
      >
        <div className="grid gap-3 text-sm text-ink/80 sm:grid-cols-3">
          <InfoItem label="Name" value={campaign.suggestedMaxTechCampaignStructure.name} />
          <InfoItem label="Audience" value={campaign.suggestedMaxTechCampaignStructure.audience} />
          <InfoItem label="Trigger" value={campaign.suggestedMaxTechCampaignStructure.trigger} />
        </div>
        <SequenceList steps={campaign.suggestedMaxTechCampaignStructure.steps} />
        <MessageBlock text={campaign.suggestedMaxTechCampaignStructure.notes} />
      </Section>

      <Section
        title="CRM Recommendation"
        copyText={`Suggested lead stage: ${campaign.suggestedLeadCategoryStage}\nNext task: ${campaign.suggestedNextTaskForAgent}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Suggested lead category/stage" value={campaign.suggestedLeadCategoryStage} />
          <InfoItem label="Suggested next task" value={campaign.suggestedNextTaskForAgent} />
        </div>
      </Section>
    </div>
  );
}

function DownloadButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-evergreen hover:text-evergreen"
    >
      <Download className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function Section({
  title,
  copyText,
  children
}: {
  title: string;
  copyText: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <CopyButton text={copyText} />
      </div>
      {children}
    </section>
  );
}

function EmailSection({ title, email }: { title: string; email: EmailDraft }) {
  return (
    <Section title={title} copyText={`Subject: ${email.subject}\n\n${email.body}`}>
      <p className="mb-3 text-sm font-semibold text-evergreen">Subject: {email.subject}</p>
      <MessageBlock text={email.body} />
    </Section>
  );
}

function SequenceSection({ title, steps }: { title: string; steps: SequenceStep[] }) {
  return (
    <Section title={title} copyText={formatSequence(steps)}>
      <SequenceList steps={steps} />
    </Section>
  );
}

function SocialSection({ title, posts }: { title: string; posts: SocialPost[] }) {
  return (
    <Section title={title} copyText={posts.map(formatSocialPost).join("\n\n")}>
      <div className="grid gap-3">
        {posts.map((post, index) => (
          <article key={`${post.platform}-${index}`} className="rounded-md border border-ink/10 bg-mist/45 p-4">
            <p className="text-xs font-semibold uppercase text-evergreen">
              {post.platform} post {index + 1}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/82">{post.caption}</p>
            {post.hashtags?.length ? (
              <p className="mt-2 break-words text-sm text-coral">{post.hashtags.join(" ")}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}

function SequenceList({ steps }: { steps: SequenceStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={`${step.day}-${step.channel}-${index}`} className="rounded-md border border-ink/10 bg-mist/45 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-evergreen px-2 py-1 text-xs font-semibold text-white">Day {step.day}</span>
            <span className="rounded bg-wheat px-2 py-1 text-xs font-semibold text-ink">{step.channel}</span>
            <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/82">{step.message}</p>
        </li>
      ))}
    </ol>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-mist/45 p-3">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-sm leading-6 text-ink">{value}</p>
    </div>
  );
}

function MessageBlock({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap rounded-md bg-mist/45 p-4 text-sm leading-6 text-ink/82">{text}</p>;
}

function PreBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-[34rem] overflow-auto rounded-md bg-ink p-4 text-sm leading-6 text-white">
      <code>{text}</code>
    </pre>
  );
}

function formatSequence(steps: SequenceStep[]) {
  return steps
    .map((step) => `Day ${step.day} - ${step.channel} - ${step.title}\n${step.message}`)
    .join("\n\n");
}

function formatSocialPost(post: SocialPost, index: number) {
  const hashtags = post.hashtags?.length ? `\n${post.hashtags.join(" ")}` : "";
  return `${post.platform} post ${index + 1}\n${post.caption}${hashtags}`;
}

function formatMaxTechSuggestion(campaign: GeneratedCampaign) {
  const suggestion = campaign.suggestedMaxTechCampaignStructure;

  return [
    `Campaign name: ${suggestion.name}`,
    `Audience: ${suggestion.audience}`,
    `Trigger: ${suggestion.trigger}`,
    "",
    formatSequence(suggestion.steps),
    "",
    `Notes: ${suggestion.notes}`
  ].join("\n");
}
