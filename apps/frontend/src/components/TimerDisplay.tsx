import { useTimer } from "../hooks/useTimer";
import type { TimerConfig, TimerControls } from "../types/timer";
import { useMemo, useEffect, useRef, useState } from "react";
import { TaskDeclarationModal } from "./TaskDeclarationModal";
import { savePomodoroSession } from "../services/pomodoro-session.service.ts";

const CIRCUMFERENCE = 2 * Math.PI * 90;
const RECENT_TASKS_KEY = "focusboard:recentTasks";
const MAX_RECENT_TASKS = 5;

interface TimerDisplayProps extends Partial<TimerConfig> {
  onSessionSaved?: () => void;
}

export function TimerDisplay({
  focusDuration = 25 * 60,
  breakDuration = 5 * 60,
  onSessionSaved,
}: TimerDisplayProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const taskRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const [recentTasks, setRecentTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_TASKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const timer: TimerControls = useTimer({
    focusDuration,
    breakDuration,
    onComplete: handleComplete,
  });

  const currentTotal = useMemo(() => {
    if (timer.state === "focusing") return focusDuration;
    if (timer.state === "break") return breakDuration;
    return focusDuration;
  }, [timer.state, focusDuration, breakDuration]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  function handleComplete() {
    playNotificationSound();
    showSystemNotification();

    if (taskRef.current && startTimeRef.current) {
      savePomodoroSession({
        taskLabel: taskRef.current,
        duration: focusDuration,
        startedAt: startTimeRef.current.toISOString(),
      })
        .then(() => {
          console.log("Session saved in backend");
          if (onSessionSaved) onSessionSaved();
        })
        .catch((err) => {
          console.error("Error saving session:", err);
        });
    }
  }

  async function playNotificationSound() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;
      const response = await fetch("/sounds/bell.mp3");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error("Error playing sound:", err);
    }
  }

  function showSystemNotification() {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    new Notification("FocusBoard: Timer Completado", {
      body: `¡Tiempo de enfoque terminado!${currentTask ? ` Tarea: ${currentTask}` : ""}`,
      icon: "/favicon.svg",
    });
  }

  const handleStartClick = () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch((err) =>
        console.error("Error requesting permission:", err),
      );
    }
    setIsModalOpen(true);
  };

  const handleTaskSubmit = (task: string) => {
    setCurrentTask(task);
    taskRef.current = task;
    startTimeRef.current = new Date();
    setIsModalOpen(false);
    saveRecentTask(task);
    timer.start();
  };

  const saveRecentTask = (task: string) => {
    setRecentTasks((prev) => {
      const filtered = prev.filter((t) => t !== task);
      const updated = [task, ...filtered].slice(0, MAX_RECENT_TASKS);
      localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const progress = timer.timeLeft / currentTotal;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor =
    timer.state === "focusing"
      ? "#4f46e5"
      : timer.state === "break"
        ? "#10b981"
        : "#6b7280";

  const stateTextMap: Record<string, string> = {
    idle: "Listo para comenzar",
    focusing: "Enfoque",
    break: "Descanso",
    paused: "En pausa",
  };
  const stateText = stateTextMap[timer.state] || "Desconocido";

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 shadow-md">
      {currentTask &&
        (timer.state === "focusing" || timer.state === "paused") && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500 mb-1">Tarea actual:</p>
            <p className="text-lg font-semibold text-gray-800">{currentTask}</p>
          </div>
        )}

      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          aria-label={`Progreso: ${Math.round(progress * 100)}%`}
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
          />
          <text
            x="100"
            y="110"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill="#1f2937"
            aria-label={`Tiempo restante: ${Math.floor(timer.timeLeft / 60)} minutos y ${timer.timeLeft % 60} segundos`}
          >
            {`${String(Math.floor(timer.timeLeft / 60)).padStart(2, "0")}:${String(timer.timeLeft % 60).padStart(2, "0")}`}
          </text>
        </svg>
      </div>

      <p
        className="text-center text-gray-600 mb-4 capitalize"
        aria-label={`Estado actual: ${stateText}`}
      >
        {stateText}
      </p>

      <p className="text-center text-gray-600 mb-6">
        Sesiones completadas: {timer.sessionsCompleted}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {timer.state === "idle" && (
          <button
            onClick={handleStartClick}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition w-full sm:w-auto"
            aria-label="Iniciar temporizador"
          >
            Comenzar
          </button>
        )}

        {timer.state === "focusing" && (
          <>
            <button
              onClick={timer.pause}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition w-full sm:w-auto"
              aria-label="Pausar temporizador"
            >
              Pausar
            </button>
            <button
              onClick={timer.reset}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition w-full sm:w-auto"
              aria-label="Reiniciar temporizador"
            >
              Reiniciar
            </button>
          </>
        )}

        {timer.state === "paused" && (
          <>
            <button
              onClick={timer.resume}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
              aria-label="Reanudar temporizador"
            >
              Reanudar
            </button>
            <button
              onClick={timer.reset}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition w-full sm:w-auto"
              aria-label="Reiniciar temporizador"
            >
              Reiniciar
            </button>
          </>
        )}

        {timer.state === "break" && (
          <button
            onClick={timer.reset}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition w-full sm:w-auto"
            aria-label="Siguiente sesión"
          >
            Siguiente Sesión
          </button>
        )}
      </div>

      <TaskDeclarationModal
        key={isModalOpen ? "open" : "closed"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleTaskSubmit}
        recentTasks={recentTasks}
      />
    </div>
  );
}
