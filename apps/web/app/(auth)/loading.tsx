import { ShieldCheck } from "lucide-react";

import { Skeleton } from "@/components/ui";

export default function AuthLoading() {
  return (
    <main
      className="auth-route-loading"
      aria-busy="true"
      aria-label="Loading secure access"
    >
      <span>
        <ShieldCheck size={23} />
      </span>
      <Skeleton height={34} rounded="lg" width={210} />
      <Skeleton height={11} rounded="full" width={290} />
      <Skeleton height={44} rounded="md" />
      <Skeleton height={44} rounded="md" />
      <Skeleton height={44} rounded="md" />
    </main>
  );
}
