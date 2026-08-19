import type { Story, StoryCategory } from "@/types/reader";

export interface PersonalizationTopic {
  id: StoryCategory;
  label: string;
  description: string;
}

export interface PersonalizationSource {
  id: string;
  name: string;
  focus: string;
}

export interface ReaderPreferencesData {
  topics: string[];
  sources: string[];
}

export interface PersonalizedStory {
  story: Story;
  reason: string;
  score: number;
}

export interface BecauseYouReadData {
  story: Story | null;
  recommendations: PersonalizedStory[];
}

export interface ReadingHistoryEntry {
  story: Story;
  progress: number;
  lastReadAt: Date;
}

export interface PersonalizationLoadingState {
  catalog: boolean;
  forYou: boolean;
  becauseYouRead: boolean;
  recommendations: boolean;
  history: boolean;
  saving: boolean;
}
