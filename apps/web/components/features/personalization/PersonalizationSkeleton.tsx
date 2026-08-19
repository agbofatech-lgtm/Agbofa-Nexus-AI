import { Skeleton } from "@/components/ui";

interface PersonalizationSkeletonProps {
  count?: number;
  variant?: "cards" | "rows" | "preferences";
}

export function PersonalizationSkeleton({
  count = 3,
  variant = "cards",
}: PersonalizationSkeletonProps) {
  if (variant === "preferences") {
    return (
      <div
        className="personalization-preferences-skeleton glass"
        aria-label="Loading reader preferences"
      >
        <Skeleton height={20} rounded="md" width={180} />
        <div>
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton
              key={index}
              height={30}
              rounded="full"
              width={75 + (index % 3) * 18}
            />
          ))}
        </div>
        <div>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton
              key={index}
              height={30}
              rounded="full"
              width={110 + (index % 2) * 25}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "rows") {
    return (
      <div
        className="personalization-row-skeletons"
        aria-label="Loading reading history"
      >
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="personalization-row-skeleton glass">
            <Skeleton height={88} rounded="lg" width={130} />
            <div>
              <Skeleton height={16} rounded="md" width="86%" />
              <Skeleton height={9} rounded="full" width="55%" />
              <Skeleton height={5} rounded="full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="personalization-card-skeletons"
      aria-label="Loading personalized stories"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="personalization-card-skeleton glass">
          <Skeleton height={150} rounded="lg" />
          <Skeleton height={10} rounded="full" width="36%" />
          <Skeleton height={19} rounded="md" width="94%" />
          <Skeleton height={10} rounded="full" width="72%" />
        </div>
      ))}
    </div>
  );
}
