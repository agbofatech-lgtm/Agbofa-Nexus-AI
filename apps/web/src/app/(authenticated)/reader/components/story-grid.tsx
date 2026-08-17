"use client";

import React from "react";
import { StoryCardData } from "../types";
import { StoryCard } from "./story-card";

export interface StoryGridProps {
  stories: StoryCardData[];
  onStoryPress: (story: StoryCardData) => void;
}

export function StoryGrid({ stories, onStoryPress }: StoryGridProps): React.JSX.Element {
  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      role="feed"
      aria-label="Story cards feed"
    >
      {stories.map((story) => (
        <StoryCard
          key={story.storyId}
          story={story}
          onPress={() => onStoryPress(story)}
        />
      ))}
    </div>
  );
}

export default StoryGrid;
