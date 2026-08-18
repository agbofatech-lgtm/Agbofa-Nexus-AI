import { SearchX } from "lucide-react";

import { Button } from "@/components/ui";

interface AgentEmptyStateProps {
  onReset: () => void;
}

export function AgentEmptyState({ onReset }: AgentEmptyStateProps) {
  return (
    <section className="agent-state glass" role="status">
      <span>
        <SearchX size={24} />
      </span>
      <div>
        <strong>No agents match these filters.</strong>
        <p>
          Reset category, status, health, or search criteria to restore the
          workforce view.
        </p>
      </div>
      <Button onClick={onReset} size="sm">
        Reset filters
      </Button>
    </section>
  );
}
