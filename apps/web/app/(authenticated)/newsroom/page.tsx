"use client";

import { ArrowRight, Factory, Radar, Scale, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { NewsroomHeader } from "@/components/features/newsroom/NewsroomHeader";
import { NewsroomSidebar } from "@/components/features/newsroom/NewsroomSidebar";
import { NewsroomStats } from "@/components/features/newsroom/NewsroomStats";
import { RecentActivity } from "@/components/features/newsroom/RecentActivity";
import { WorkflowRail } from "@/components/shared/operations/WorkflowRail";
import { Button, Skeleton } from "@/components/ui";
import { useNewsroom } from "@/hooks/useNewsroom";

const workspaces = [
  {
    label: "Origination",
    detail: "Monitor sources and ingestion health",
    href: "/newsroom/origination",
    icon: Radar,
  },
  {
    label: "Content Factory",
    detail: "Generate complete media packages",
    href: "/newsroom/factory",
    icon: Factory,
  },
  {
    label: "Editorial Review",
    detail: "Move stories through human approval",
    href: "/newsroom/review",
    icon: ShieldCheck,
  },
  {
    label: "Truth Engine",
    detail: "Investigate claims and evidence",
    href: "/truth",
    icon: Scale,
  },
] as const;

export default function NewsroomPage() {
  const newsroom = useNewsroom("dashboard");
  return (
    <div className="newsroom-page">
      <NewsroomHeader
        title="Newsroom"
        subtitle="Your editorial command center for trusted, intelligent media operations."
      />
      <NewsroomSidebar />
      {newsroom.error ? (
        <div className="workspace-error glass" role="alert">
          <strong>Newsroom unavailable</strong>
          <p>{newsroom.error}</p>
          <Button onClick={newsroom.retry} size="sm">
            Retry
          </Button>
        </div>
      ) : null}
      <NewsroomStats
        loading={newsroom.loading.dashboard}
        metrics={newsroom.dashboard?.metrics ?? []}
      />
      {newsroom.dashboard ? (
        <WorkflowRail
          description="Human editorial authority remains explicit; publishing requires integration."
          stages={newsroom.dashboard.workflow}
          title="Editorial operating pipeline"
        />
      ) : null}
      <section className="newsroom-workspaces" aria-label="Newsroom workspaces">
        {workspaces.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              className="workspace-card glass-card"
              href={item.href}
            >
              <span>
                <Icon size={19} />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
              <ArrowRight size={15} />
            </Link>
          );
        })}
      </section>
      <div className="newsroom-dashboard-grid">
        {newsroom.loading.dashboard ? (
          <Skeleton height={390} rounded="lg" />
        ) : (
          <RecentActivity activity={newsroom.dashboard?.activity ?? []} />
        )}
        <aside className="newsroom-health glass-gold">
          <span className="section-kicker">Workflow health model</span>
          <div
            className="newsroom-health__ring"
            style={
              {
                "--health": `${newsroom.dashboard?.queueHealth ?? 0}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{newsroom.dashboard?.queueHealth ?? 0}%</strong>
              <span>queue health</span>
            </div>
          </div>
          <ul>
            <li>
              <span>Active sources</span>
              <strong>{newsroom.dashboard?.activeSources ?? 0}</strong>
            </li>
            <li>
              <span>Pending reviews</span>
              <strong>{newsroom.dashboard?.pendingReviews ?? 0}</strong>
            </li>
            <li>
              <span>Median review time</span>
              <strong>{newsroom.dashboard?.medianReviewMinutes ?? 0}m</strong>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
