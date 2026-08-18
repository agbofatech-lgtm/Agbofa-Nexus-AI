"use client";

import { ClipboardCheck } from "lucide-react";

import { NewsroomHeader } from "@/components/features/newsroom/NewsroomHeader";
import { NewsroomSidebar } from "@/components/features/newsroom/NewsroomSidebar";
import { ReviewFilter } from "@/components/features/newsroom/ReviewFilter";
import { ReviewQueue } from "@/components/features/newsroom/ReviewQueue";
import { Button } from "@/components/ui";
import { useNewsroom } from "@/hooks/useNewsroom";

export default function ReviewPage() {
  const newsroom = useNewsroom("review");
  return (
    <div className="newsroom-page">
      <NewsroomHeader
        eyebrow="Human editorial control"
        title="Review"
        subtitle="Filter, inspect, approve, reject, and publish every story package that requires human judgment."
      />
      <NewsroomSidebar />
      {newsroom.error ? (
        <div className="workspace-error glass" role="alert">
          <ClipboardCheck size={20} />
          <div>
            <strong>Review queue unavailable</strong>
            <p>{newsroom.error}</p>
          </div>
          <Button onClick={newsroom.retry} size="sm">
            Retry
          </Button>
        </div>
      ) : null}
      <ReviewFilter />
      <ReviewQueue
        items={newsroom.reviewItems}
        loading={newsroom.loading.review}
      />
    </div>
  );
}
