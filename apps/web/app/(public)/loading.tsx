import { Skeleton } from "@/components/ui";

export default function PublicLoading() {
  return (
    <main
      className="public-loading"
      aria-busy="true"
      aria-label="Loading public experience"
    >
      <section className="public-loading__hero">
        <Skeleton height={12} rounded="full" width={180} />
        <Skeleton height={68} rounded="lg" width="78%" />
        <Skeleton height={68} rounded="lg" width="62%" />
        <Skeleton height={18} rounded="full" width={360} />
        <Skeleton height={50} rounded="lg" width={290} />
      </section>
      <section className="public-loading__cards">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={250} rounded="lg" />
        ))}
      </section>
    </main>
  );
}
