import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerConfig, TimerState, WorkerResponse } from "../types/timer";

const STORAGE_KEY = {
  state: "timer:state",
  timeLeft: "timer:timeLeft",
  sessionsCompleted: "timer:sessionsCompleted",
  lastUpdated: "timer:lastUpdated",
};

function getInitialTimeLeft(focusDuration: number): number {
  const savedTimeLeft = sessionStorage.getItem(STORAGE_KEY.timeLeft);
  const savedLastUpdated = sessionStorage.getItem(STORAGE_KEY.lastUpdated);

  if (savedTimeLeft && savedLastUpdated) {
    const lastUpdated = parseInt(savedLastUpdated, 10);
    const now = Date.now();
    const elapsed = Math.floor((now - lastUpdated) / 1000);
    const restoredTimeLeft = parseInt(savedTimeLeft, 10) - elapsed;

    if (restoredTimeLeft > 0) {
      return restoredTimeLeft;
    }
  }

  return focusDuration;
}

function getInitialState(): TimerState {
  const savedState = sessionStorage.getItem(
    STORAGE_KEY.state,
  ) as TimerState | null;
  if (
    savedState &&
    ["idle", "focusing", "break", "paused"].includes(savedState)
  ) {
    return savedState;
  }
  return "idle";
}

function getInitialSessions(): number {
  const saved = sessionStorage.getItem(STORAGE_KEY.sessionsCompleted);
  return saved ? parseInt(saved, 10) : 0;
}

export function useTimer(config?: TimerConfig) {
  const {
    focusDuration = 25 * 60,
    breakDuration = 5 * 60,
    onComplete,
  } = config || {};

  const [timeLeft, setTimeLeft] = useState(() =>
    getInitialTimeLeft(focusDuration),
  );
  const [state, setState] = useState<TimerState>(getInitialState);
  const [sessionsCompleted, setSessionsCompleted] =
    useState(getInitialSessions);

  const workerRef = useRef<Worker | null>(null);
  const onCompleteRef = useRef(onComplete);
  const isInitializedRef = useRef(false);
  const lastCompletedAtRef = useRef<number>(0);
  const pausedFromStateRef = useRef<TimerState>("focusing");
  const initialStateRef = useRef<TimerState>(state);
  const initialTimeLeftRef = useRef<number>(timeLeft);

  // Update callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Initialize worker
  useEffect(() => {
    // Create worker
    const workerScript = new URL("../utils/timer.worker.ts", import.meta.url);
    const worker = new Worker(workerScript, { type: "module" });

    const handleWorkerMessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "tick") {
        setTimeLeft(message.timeLeft!);
        sessionStorage.setItem(STORAGE_KEY.timeLeft, String(message.timeLeft));
        sessionStorage.setItem(STORAGE_KEY.lastUpdated, String(Date.now()));
      } else if (message.type === "completed") {
        // Prevenir ejecución doble: solo procesar si han pasado >500ms desde la última vez
        const now = Date.now();
        if (now - lastCompletedAtRef.current < 500) {
          return; // Ignorar si es muy pronto (doble-call en StrictMode)
        }
        lastCompletedAtRef.current = now;

        onCompleteRef.current?.();

        setState((prevState) => {
          let nextState: TimerState;
          let nextDuration: number;

          if (prevState === "focusing") {
            nextState = "break";
            nextDuration = breakDuration;
            setTimeLeft(breakDuration);
            sessionStorage.setItem(STORAGE_KEY.timeLeft, String(breakDuration));

            // Reiniciar worker con nueva duración
            if (workerRef.current) {
              workerRef.current.postMessage({
                type: "start",
                duration: nextDuration,
              });
            }
          } else if (prevState === "break") {
            nextState = "idle";
            nextDuration = focusDuration;
            setTimeLeft(focusDuration);
            sessionStorage.setItem(STORAGE_KEY.timeLeft, String(focusDuration));
            // ✅ Incrementar sesiones completadas cuando break termina
            setSessionsCompleted((prev) => {
              const newSessions = prev + 1;
              sessionStorage.setItem(
                STORAGE_KEY.sessionsCompleted,
                String(newSessions),
              );
              return newSessions;
            });

            // Reset worker para siguiente sesión
            if (workerRef.current) {
              workerRef.current.postMessage({
                type: "reset",
                duration: focusDuration,
              });
            }
          } else {
            nextState = prevState;
          }

          sessionStorage.setItem(STORAGE_KEY.state, nextState);
          return nextState;
        });
      }
    };

    worker.addEventListener("message", handleWorkerMessage);
    workerRef.current = worker;

    return () => {
      worker.removeEventListener("message", handleWorkerMessage);
      worker.postMessage({ type: "terminate" });
      worker.terminate();
      workerRef.current = null;
    };
  }, [focusDuration, breakDuration]);

  // Reiniciar worker si se restauró estado activo del sessionStorage (Test 7)
  useEffect(() => {
    if (isInitializedRef.current || !workerRef.current) return;

    isInitializedRef.current = true;

    // Si se restauró un estado activo, reiniciar el worker con el timeLeft restaurado
    if (initialStateRef.current === "focusing") {
      workerRef.current.postMessage({
        type: "start",
        duration: initialTimeLeftRef.current,
      });
    } else if (initialStateRef.current === "break") {
      workerRef.current.postMessage({
        type: "start",
        duration: initialTimeLeftRef.current,
      });
    } else if (initialStateRef.current === "paused") {
      workerRef.current.postMessage({ type: "pause" });
    }
  }, []);

  const start = useCallback(() => {
    setState("focusing");
    setTimeLeft(focusDuration);
    sessionStorage.setItem(STORAGE_KEY.state, "focusing");
    sessionStorage.setItem(STORAGE_KEY.timeLeft, String(focusDuration));
    sessionStorage.setItem(STORAGE_KEY.lastUpdated, String(Date.now()));

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "start", duration: focusDuration });
    }
  }, [focusDuration]);

  const pause = useCallback(() => {
    pausedFromStateRef.current = state;
    setState("paused");
    sessionStorage.setItem(STORAGE_KEY.state, "paused");
    sessionStorage.setItem(STORAGE_KEY.lastUpdated, String(Date.now()));

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "pause" });
    }
  }, [state]);

  const resume = useCallback(() => {
    const restoredState =
      pausedFromStateRef.current === "break" ? "break" : "focusing";
    setState(restoredState);
    sessionStorage.setItem(STORAGE_KEY.state, restoredState);
    sessionStorage.setItem(STORAGE_KEY.lastUpdated, String(Date.now()));

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "resume" });
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTimeLeft(focusDuration);
    sessionStorage.setItem(STORAGE_KEY.state, "idle");
    sessionStorage.setItem(STORAGE_KEY.timeLeft, String(focusDuration));
    sessionStorage.setItem(STORAGE_KEY.lastUpdated, String(Date.now()));

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "reset", duration: focusDuration });
    }
  }, [focusDuration]);

  return {
    timeLeft,
    state,
    sessionsCompleted,
    start,
    pause,
    resume,
    reset,
  };
}
