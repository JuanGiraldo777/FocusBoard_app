export type TimerState = "idle" | "focusing" | "break" | "paused";

export interface TimerConfig {
  focusDuration?: number;
  breakDuration?: number;
  sessionGoal?: number;
  onComplete?: () => void;
}

export interface TimerContextState {
  timeLeft: number;
  state: TimerState;
  sessionsCompleted: number;
}

export type WorkerMessage =
  | { type: "start"; duration: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset"; duration: number }
  | { type: "terminate" };

export type WorkerResponse =
  | { type: "tick"; timeLeft: number }
  | { type: "completed" };
