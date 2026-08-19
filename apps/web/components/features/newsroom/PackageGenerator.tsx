"use client";

import {
  CheckCircle2,
  Edit3,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PackageTypeSelector } from "@/components/features/newsroom/PackageTypeSelector";
import { StoryPackageCard } from "@/components/features/newsroom/StoryPackageCard";
import { Badge, Button, Skeleton } from "@/components/ui";
import type {
  FactoryStory,
  PackageStatus,
  PackageType,
  StoryPackage,
} from "@/types/newsroom";

interface PackageGeneratorProps {
  stories: FactoryStory[];
  selectedStoryId: string | null;
  selectedTypes: PackageType[];
  generatedPackage: StoryPackage | null;
  loading: boolean;
  generating: boolean;
  onSelectStory: (id: string) => void;
  onToggleType: (type: PackageType) => void;
  onGenerate: () => void;
  onUpdateStatus: (status: PackageStatus) => void;
}

export function PackageGenerator({
  stories,
  selectedStoryId,
  selectedTypes,
  generatedPackage,
  loading,
  generating,
  onSelectStory,
  onToggleType,
  onGenerate,
  onUpdateStatus,
}: PackageGeneratorProps) {
  const [activeOutput, setActiveOutput] = useState<PackageType>("article");
  useEffect(() => {
    const first = generatedPackage?.outputs[0]?.type;
    if (first) setActiveOutput(first);
  }, [generatedPackage]);
  const output =
    generatedPackage?.outputs.find((item) => item.type === activeOutput) ??
    generatedPackage?.outputs[0];

  if (loading) {
    return (
      <div className="package-generator">
        <Skeleton height={420} rounded="lg" />
        <Skeleton height={420} rounded="lg" />
      </div>
    );
  }

  return (
    <div className="package-generator">
      <section
        className="factory-story-list glass"
        aria-labelledby="factory-stories-title"
      >
        <div className="factory-panel-heading">
          <div>
            <span className="section-kicker">Verified queue</span>
            <h2 id="factory-stories-title">Select a story</h2>
          </div>
          <Badge status="running">{stories.length} ready</Badge>
        </div>
        <div>
          {stories.map((story) => (
            <StoryPackageCard
              key={story.id}
              onSelect={onSelectStory}
              selected={story.id === selectedStoryId}
              story={story}
            />
          ))}
        </div>
      </section>

      <section
        className="package-composer glass-gold"
        aria-labelledby="package-composer-title"
      >
        <div className="factory-panel-heading">
          <div>
            <span className="section-kicker">
              <Sparkles size={11} /> Content assembly
            </span>
            <h2 id="package-composer-title">Generate package</h2>
          </div>
          <span>{selectedTypes.length} outputs</span>
        </div>
        <PackageTypeSelector onToggle={onToggleType} selected={selectedTypes} />
        <Button
          disabled={!selectedStoryId || !selectedTypes.length}
          loading={generating}
          onClick={onGenerate}
          size="lg"
        >
          <PackageCheck size={16} /> Generate package
        </Button>
      </section>

      <section
        className="package-preview glass"
        aria-labelledby="package-preview-title"
      >
        <div className="factory-panel-heading">
          <div>
            <span className="section-kicker">Generated preview</span>
            <h2 id="package-preview-title">Package output</h2>
          </div>
          {generatedPackage ? (
            <Badge
              verification={
                generatedPackage.status === "verified" ||
                generatedPackage.status === "approved" ||
                generatedPackage.status === "distributed"
                  ? "verified"
                  : "in-review"
              }
              variant="verification"
            >
              {generatedPackage.status}
            </Badge>
          ) : null}
        </div>
        {generatedPackage && output ? (
          <>
            <div className="package-output-tabs" role="tablist">
              {generatedPackage.outputs.map((item) => (
                <button
                  key={item.type}
                  aria-selected={item.type === output.type}
                  onClick={() => setActiveOutput(item.type)}
                  role="tab"
                  type="button"
                >
                  {item.type}
                </button>
              ))}
            </div>
            <article className="package-output">
              <span>
                {output.type} · {output.characterCount} characters
              </span>
              <h3>{output.title}</h3>
              <p>{output.body}</p>
            </article>
            <div className="package-actions">
              <Button
                onClick={() => onUpdateStatus("editing")}
                size="sm"
                variant="ghost"
              >
                <Edit3 size={13} /> Edit
              </Button>
              <Button
                onClick={() => onUpdateStatus("verified")}
                size="sm"
                variant="ghost"
              >
                <ShieldCheck size={13} /> Verify
              </Button>
              <Button
                onClick={() => onUpdateStatus("approved")}
                size="sm"
                variant="success"
              >
                <CheckCircle2 size={13} /> Approve
              </Button>
              <Button
                disabled={generatedPackage.status !== "approved"}
                onClick={() => onUpdateStatus("distributed")}
                size="sm"
              >
                <Send size={13} /> Distribute
              </Button>
            </div>
          </>
        ) : (
          <div className="factory-empty">
            <Sparkles size={24} />
            <strong>No package generated yet.</strong>
            <p>
              Select a story and output types, then generate a complete content
              package.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
