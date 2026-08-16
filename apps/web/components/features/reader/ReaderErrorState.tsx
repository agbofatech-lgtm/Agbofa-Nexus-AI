import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui";

interface ReaderErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ReaderErrorState({ message, onRetry }: ReaderErrorStateProps) {
  return (
    <section className="reader-state reader-state--error glass" role="alert">
      <span className="reader-state__icon">
        <AlertTriangle size={27} />
      </span>
      <span className="section-kicker">Reader connection</span>
      <h2>Failed to load your feed.</h2>
      <p>{message}</p>
      <Button onClick={onRetry}>
        <RefreshCw size={15} /> Retry feed
      </Button>
    </section>
  );
}
