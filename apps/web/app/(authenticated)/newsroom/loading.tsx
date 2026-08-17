import { Skeleton } from "@/components/ui";

export default function NewsroomLoading() {
  return (
    <main className="workspace-loading" aria-label="Loading newsroom">
      <Skeleton height={18} width={160} />
      <Skeleton height={48} width="48%" />
      <div>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={140} rounded="lg" />
        ))}
      </div>
      <Skeleton height={360} rounded="lg" />
    </main>
  );
}
