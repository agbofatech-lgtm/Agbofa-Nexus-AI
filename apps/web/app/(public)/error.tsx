"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui";

interface PublicErrorProps {
  reset: () => void;
}

export default function PublicError({ reset }: PublicErrorProps) {
  return (
    <main className="public-error" role="alert">
      <span>
        <AlertTriangle size={26} />
      </span>
      <h1>Failed to load the Nexus experience.</h1>
      <p>
        The public intelligence layer could not be rendered. Retry the request
        to continue.
      </p>
      <Button onClick={reset}>
        <RefreshCw size={16} /> Retry
      </Button>
    </main>
  );
}
