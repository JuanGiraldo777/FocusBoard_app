export type TimerState = "idle" | "focusing" | "break" | "paused";

export interface TimerConfig {
  focusDuration?: number;
  breakDuration?: number;
  onComplete?: () => void;
}

export interface WorkerResponse {
  type: "tick" | "completed";
  timeLeft?: number;
}

export interface TimerControls {
  timeLeft: number;
  state: TimerState;
  sessionsCompleted: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}
