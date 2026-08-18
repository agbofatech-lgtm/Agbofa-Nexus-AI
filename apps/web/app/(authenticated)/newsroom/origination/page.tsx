"use client";

import { Activity, DatabaseZap } from "lucide-react";

import { IngestionPipeline } from "@/components/features/newsroom/IngestionPipeline";
import { NewsroomHeader } from "@/components/features/newsroom/NewsroomHeader";
import { NewsroomSidebar } from "@/components/features/newsroom/NewsroomSidebar";
import { SourceGrid } from "@/components/features/newsroom/SourceGrid";
import { Button } from "@/components/ui";
import { useNewsroom } from "@/hooks/useNewsroom";
import { useNewsroomStore } from "@/stores/newsroom-store";
import type { SourceStatus } from "@/types/newsroom";

const filters: Array<SourceStatus | "all"> = [
  "all",
  "active",
  "degraded",
  "inactive",
];

export default function OriginationPage() {
  const newsroom = useNewsroom("origination");
  const filter = useNewsroomStore((state) => state.sourceFilter);
  const setFilter = useNewsroomStore((state) => state.setSourceFilter);
  return (
    <div className="newsroom-page">
      <NewsroomHeader
        eyebrow="Source intelligence"
        title="Origination"
        subtitle="Discover, ingest, normalize, and route the source signals that power the newsroom."
      />
      <NewsroomSidebar />
      <div className="source-filter-row">
        <div role="tablist" aria-label="Source health filter">
          {filters.map((status) => (
            <button
              key={status}
              aria-selected={filter === status}
              onClick={() => setFilter(status)}
              role="tab"
              type="button"
            >
              <span />
              {status}
              <b>
                {status === "all"
                  ? newsroom.sources.length
                  : newsroom.sources.filter(
                      (source) => source.status === status,
                    ).length}
              </b>
            </button>
          ))}
        </div>
        <span>
          <Activity size={13} /> 24 sources monitored
        </span>
      </div>
      {newsroom.error ? (
        <div className="workspace-error glass" role="alert">
          <DatabaseZap size={20} />
          <div>
            <strong>Source network unavailable</strong>
            <p>{newsroom.error}</p>
          </div>
          <Button onClick={newsroom.retry} size="sm">
            Retry
          </Button>
        </div>
      ) : null}
      <SourceGrid
        filter={filter}
        loading={newsroom.loading.origination}
        sources={newsroom.sources}
      />
      <IngestionPipeline
        loading={newsroom.loading.origination}
        stages={newsroom.pipeline}
      />
    </div>
  );
}
