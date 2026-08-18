"use client";

import { Factory } from "lucide-react";

import { NewsroomHeader } from "@/components/features/newsroom/NewsroomHeader";
import { NewsroomSidebar } from "@/components/features/newsroom/NewsroomSidebar";
import { PackageGenerator } from "@/components/features/newsroom/PackageGenerator";
import { Button } from "@/components/ui";
import { useNewsroom } from "@/hooks/useNewsroom";

export default function FactoryPage() {
  const newsroom = useNewsroom("factory");
  return (
    <div className="newsroom-page">
      <NewsroomHeader
        eyebrow="Multimodal production"
        title="Content Factory"
        subtitle="Turn verified intelligence into complete article, social, video, audio, newsletter, and visual packages."
      />
      <NewsroomSidebar />
      {newsroom.error ? (
        <div className="workspace-error glass" role="alert">
          <Factory size={20} />
          <div>
            <strong>Factory action needs attention</strong>
            <p>{newsroom.error}</p>
          </div>
          <Button onClick={newsroom.retry} size="sm">
            Retry
          </Button>
        </div>
      ) : null}
      <PackageGenerator
        generatedPackage={newsroom.generatedPackage}
        generating={newsroom.loading.generating}
        loading={newsroom.loading.factory}
        onGenerate={() => void newsroom.generatePackage()}
        onSelectStory={newsroom.setSelectedStoryId}
        onToggleType={newsroom.togglePackageType}
        onUpdateStatus={(status) => void newsroom.updatePackageStatus(status)}
        selectedStoryId={newsroom.selectedStoryId}
        selectedTypes={newsroom.packageTypes}
        stories={newsroom.factoryStories}
      />
    </div>
  );
}
