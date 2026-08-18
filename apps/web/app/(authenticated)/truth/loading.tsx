import { Skeleton } from "@/components/ui";

export default function TruthLoading() {
  return (
    <div className="workspace-loading" aria-label="Loading Truth Engine">
      <Skeleton height={18} width={170} />
      <Skeleton height={48} width="55%" />
      <div>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={110} rounded="lg" />
        ))}
      </div>
      <Skeleton height={480} rounded="lg" />
    </div>
  );
}
