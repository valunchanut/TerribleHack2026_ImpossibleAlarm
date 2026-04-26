import MathChallenge from "../tasks/MathChallenge";
import ShakeChallenge from "../tasks/ShakeChallenge";

export type TaskDifficulty = "easy" | "medium" | "hard";

export interface TaskResult {
  success: boolean;
  timeMs?: number;
}

export interface TaskProps {
  difficulty: TaskDifficulty;
  onComplete: (result: TaskResult) => void;
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<TaskProps>;
  availableFor: TaskDifficulty[];
  emoji: string;
}

// ─── TASK REGISTRY ───────────────────────────────────────────────────────────
// Add new tasks here. They'll automatically be eligible for random selection.
const TASK_REGISTRY: TaskDefinition[] = [
  {
    id: "math",
    name: "Math Problems",
    description: "Solve arithmetic equations",
    component: MathChallenge,
    availableFor: ["easy", "medium", "hard"],
    emoji: "🧮",
  },
  {
    id: "shake",
    name: "Shake It Off",
    description: "Shake your phone in rhythm",
    component: ShakeChallenge,
    availableFor: ["easy", "medium", "hard"],
    emoji: "📳",
  },
  // Future tasks plug in here:
  // { id: "wordle", name: "Word Game", component: WordleChallenge, ... }
  // { id: "memory", name: "Memory Match", component: MemoryChallenge, ... }
  // { id: "duolingo", name: "Language Lesson", component: DuolingoChallenge, ... }
];

export function getRandomTask(difficulty: TaskDifficulty): TaskDefinition {
  const eligible = TASK_REGISTRY.filter((t) =>
    t.availableFor.includes(difficulty)
  );
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_REGISTRY.find((t) => t.id === id);
}

export { TASK_REGISTRY };
