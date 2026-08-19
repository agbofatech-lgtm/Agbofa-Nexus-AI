import { Skeleton } from "@/components/ui";

export function StorySkeleton() {
  return (
    <article
      className="story-skeleton"
      aria-busy="true"
      aria-label="Loading story"
    >
      <header>
        <Skeleton height={22} rounded="full" width={110} />
        <Skeleton height={58} rounded="lg" width="96%" />
        <Skeleton height={58} rounded="lg" width="76%" />
        <Skeleton height={16} rounded="md" width="68%" />
        <Skeleton height={10} rounded="full" width="44%" />
      </header>
      <Skeleton className="story-skeleton__hero" rounded="lg" />
      <div className="story-skeleton__body">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton
            key={index}
            height={12}
            rounded="full"
            width={index % 3 === 2 ? "78%" : "100%"}
          />
        ))}
        <Skeleton height={170} rounded="lg" />
        <Skeleton height={300} rounded="lg" />
      </div>
    </article>
  );
}
