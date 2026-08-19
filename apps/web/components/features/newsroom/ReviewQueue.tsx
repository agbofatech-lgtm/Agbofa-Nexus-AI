"use client";

import { ClipboardList } from "lucide-react";

import { ReviewItem } from "@/components/features/newsroom/ReviewItem";
import { Button, Skeleton } from "@/components/ui";
import { useNewsroomStore } from "@/stores/newsroom-store";
import type { ReviewItem as ReviewItemType } from "@/types/newsroom";

interface ReviewQueueProps {
  items: ReviewItemType[];
  loading?: boolean;
}

export function ReviewQueue({ items, loading = false }: ReviewQueueProps) {
  const filters = useNewsroomStore((state) => state.reviewFilters);
  const visible = useNewsroomStore((state) => state.reviewVisible);
  const loadMore = useNewsroomStore((state) => state.loadMoreReviews);
  const updateStatus = useNewsroomStore((state) => state.updateReviewStatus);
  const normalizedSearch = filters.search.trim().toLowerCase();
  const filtered = items.filter(
    (item) =>
      (filters.status === "all" || item.status === filters.status) &&
      (!filters.assignee || item.assignee === filters.assignee) &&
      (!filters.source || item.source === filters.source) &&
      (!normalizedSearch ||
        item.headline.toLowerCase().includes(normalizedSearch)),
  );
  const displayed = filtered.slice(0, visible);

  if (loading) {
    return (
      <div className="review-queue glass" aria-label="Loading review queue">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="review-item">
            <Skeleton height={22} width={80} />
            <Skeleton height={15} width="70%" />
            <Skeleton height={10} width={55} />
            <Skeleton height={10} width={60} />
          </div>
        ))}
      </div>
    );
  }
  if (!displayed.length) {
    return (
      <div className="newsroom-empty glass">
        <ClipboardList size={24} />
        <div>
          <strong>No review items match.</strong>
          <p>Adjust status, assignee, source, or search filters.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="review-queue glass" aria-label="Editorial review queue">
      <div className="review-queue__columns">
        <span>Status</span>
        <span>Headline</span>
        <span>Confidence</span>
        <span>Updated</span>
        <span>Actions</span>
      </div>
      {displayed.map((item) => (
        <ReviewItem key={item.id} item={item} onStatusChange={updateStatus} />
      ))}
      <div className="review-queue__footer">
        <span>
          {displayed.length} of {filtered.length} items
        </span>
        {visible < filtered.length ? (
          <Button onClick={loadMore} variant="ghost">
            Load more
          </Button>
        ) : (
          <strong>End of queue</strong>
        )}
      </div>
    </section>
  );
}
