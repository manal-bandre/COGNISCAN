export type TaskCatalogItem = {
  key: string;
  name: string;
  domain: "Memory" | "Language" | "Attention" | "Motor";
  difficulty: "Easy" | "Medium" | "Hard";
  durationSec: number;
  description: string;
  prompt: string;
};

export const TASKS_CATALOG: TaskCatalogItem[] = [
  {
    key: "memory_recall",
    name: "Memory recall",
    domain: "Memory",
    difficulty: "Medium",
    durationSec: 180,
    description: "Remember and recall a list of 5 objects shown briefly.",
    prompt: "Apple, Chair, Lamp, River, Clock",
  },
  {
    key: "word_fluency",
    name: "Word fluency",
    domain: "Language",
    difficulty: "Easy",
    durationSec: 120,
    description: "Name as many animals as possible in 60 seconds.",
    prompt: "Name as many animals as you can in 60 seconds.",
  },
  {
    key: "pattern_match",
    name: "Pattern match",
    domain: "Attention",
    difficulty: "Hard",
    durationSec: 240,
    description: "Identify the repeating pattern in a sequence.",
    prompt: "Find the next item: A B A B A ?",
  },
  {
    key: "clock_drawing",
    name: "Clock drawing",
    domain: "Motor",
    difficulty: "Easy",
    durationSec: 120,
    description: "Draw a clock showing 3:45.",
    prompt: "Draw a clock showing 3:45 (type a description if on web).",
  },
  {
    key: "story_recall",
    name: "Story recall",
    domain: "Memory",
    difficulty: "Medium",
    durationSec: 300,
    description: "Listen to a short story and answer questions.",
    prompt: "After reading a short story, summarize it in 2–3 sentences.",
  },
];

