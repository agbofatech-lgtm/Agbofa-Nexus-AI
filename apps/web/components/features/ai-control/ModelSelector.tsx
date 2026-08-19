"use client";

import { Box, CheckCircle2, CircleOff } from "lucide-react";

import type { AIProvider } from "@/types/ai-control";

interface ModelSelectorProps {
  provider: AIProvider | null;
  selectedModel: string;
  onSelect: (id: string) => void;
}

export function ModelSelector({
  provider,
  selectedModel,
  onSelect,
}: ModelSelectorProps) {
  return (
    <section className="model-selector glass">
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">
            <Box size={12} /> Demo model catalog
          </span>
          <h2>Model selection</h2>
        </div>
        <span>Frontend state only</span>
      </div>
      {provider ? (
        <div>
          {provider.models.map((model) => (
            <button
              key={model.id}
              aria-pressed={selectedModel === model.id}
              disabled={model.availability === "unavailable"}
              onClick={() => onSelect(model.id)}
              type="button"
            >
              <span>
                {model.availability === "unavailable" ? (
                  <CircleOff size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
              </span>
              <div>
                <strong>{model.name}</strong>
                <small>
                  {model.capability} · {model.contextWindow}
                </small>
              </div>
              <b>{model.availability}</b>
            </button>
          ))}
        </div>
      ) : (
        <p>No provider selected.</p>
      )}
    </section>
  );
}
