import { Skeleton } from "@/components/ui";

interface ReaderFeedSkeletonProps {
  compact?: boolean;
}

export function ReaderFeedSkeleton({
  compact = false,
}: ReaderFeedSkeletonProps) {
  if (compact) {
    return (
      <div className="reader-loading-more" aria-label="Loading more stories">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="reader-card-skeleton glass">
            <Skeleton height={145} rounded="lg" />
            <Skeleton height={10} rounded="full" width="28%" />
            <Skeleton height={20} rounded="md" width="94%" />
            <Skeleton height={12} rounded="md" width="72%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      className="reader-feed-skeleton"
      aria-busy="true"
      aria-label="Loading reader feed"
    >
      <div className="reader-featured-skeleton glass">
        <Skeleton height="100%" rounded="lg" />
        <div>
          <Skeleton height={22} rounded="full" width={90} />
          <Skeleton height={35} rounded="md" width="95%" />
          <Skeleton height={35} rounded="md" width="76%" />
          <Skeleton height={12} rounded="full" width="66%" />
          <Skeleton height={8} rounded="full" />
        </div>
      </div>
      <div className="reader-skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="reader-card-skeleton glass">
            <Skeleton height={170} rounded="lg" />
            <Skeleton height={10} rounded="full" width="28%" />
            <Skeleton height={20} rounded="md" width="94%" />
            <Skeleton height={12} rounded="md" width="72%" />
            <Skeleton height={8} rounded="full" />
          </div>
        ))}
      </div>
    </section>
  );
}
