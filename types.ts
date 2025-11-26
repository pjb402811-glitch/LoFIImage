export interface PromptInputs {
  mood: string;
  location: string;
  objects: string;
  people: string;
  animals: string;
  time: string;
  weather: string;
  ratio: string;
  artStyle: string;
  customModifiers: string[];
}

export interface ArtStyleDef {
  label: string;
  prompt: string;
}

export type ArtStylesMap = Record<string, ArtStyleDef>;

export type KeywordMap = Record<string, string>;

export type PresetCategory = 'daily' | 'travel' | 'season';

export interface Preset {
  label: string;
  emoji: string;
  category: PresetCategory;
  data: Partial<PromptInputs>;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  videoPrompt?: string; // Added field for video specific prompt
  inputs: PromptInputs;
  koreanExplanation: string;
}