import { useTimer } from "../hooks/useTimer";
import type { TimerConfig, TimerControls } from "../types/timer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TaskDeclarationModal } from "./TaskDeclarationModal";
import { AmbientSoundControls } from "./AmbientSoundControls.tsx";
import { savePomodoroSession } from "../services/pomodoro-session.service.ts";
import { useAmbientAudio } from "../hooks/useAmbientAudio.ts";

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

  const handleComplete = useCallback(() => {
    void playNotificationSound();
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
  }, [
    focusDuration,
    onSessionSaved,
    playNotificationSound,
    showSystemNotification,
  ]);

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

  const ambientAudio = useAmbientAudio(timer.state === "focusing");

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

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

  const handleStartClick = useCallback(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch((err) =>
        console.error("Error requesting permission:", err),
      );
    }
    setIsModalOpen(true);
  }, []);

  const saveRecentTask = useCallback((task: string) => {
    setRecentTasks((prev) => {
      const filtered = prev.filter((t) => t !== task);
      const updated = [task, ...filtered].slice(0, MAX_RECENT_TASKS);
      localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleTaskSubmit = useCallback(
    (task: string) => {
      setCurrentTask(task);
      taskRef.current = task;
      startTimeRef.current = new Date();
      setIsModalOpen(false);
      saveRecentTask(task);
      timer.start();
    },
    [saveRecentTask, timer],
  );

  const progress = timer.timeLeft / currentTotal;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor =
    timer.state === "focusing"
      ? "#F5A623"
      : timer.state === "break"
        ? "#3B82F6"
        : "#9CA3AF";

  const stateTextMap: Record<string, string> = {
    idle: "Listo para comenzar",
    focusing: "Enfoque",
    break: "Descanso",
    paused: "En pausa",
  };
  const stateText = stateTextMap[timer.state] || "Desconocido";

  const stateColors: Record<string, string> = {
    idle: "bg-gray-100 text-[#4B5563] dark:bg-[#2D3748] dark:text-[#9CA3AF]",
    focusing:
      "bg-amber-100 text-[#F5A623] dark:bg-amber-900/20 dark:text-[#F5A623]",
    break: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    paused:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
  };

  return (
    <div className="space-y-6">
      {/* Tarea actual */}
      {currentTask &&
        (timer.state === "focusing" || timer.state === "paused") && (
          <div className="bg-[#F7F8FA] dark:bg-[#2D3748] rounded-lg p-4 border-l-2 border-[#F5A623]">
            <p className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wide mb-1">
              Tarea actual
            </p>
            <p className="text-lg font-semibold text-[#1C2333] dark:text-white break-words">
              {currentTask}
            </p>
          </div>
        )}

      {/* Badge Estado */}
      <div className="flex justify-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${stateColors[timer.state]}`}
        >
          {stateText}
        </span>
      </div>

      {/* Timer Display - SVG Circular */}
      <div className="flex justify-center">
        <div className="relative w-64 h-64">
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
              stroke="#EAECF0"
              className="dark:stroke-[#2D3748]"
              strokeWidth="8"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-300"
            />
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fontSize="48"
              fontWeight="bold"
              fill="#1C2333"
              className="dark:fill-white"
              aria-label={`Tiempo restante: ${Math.floor(timer.timeLeft / 60)} minutos y ${timer.timeLeft % 60} segundos`}
            >
              {`${String(Math.floor(timer.timeLeft / 60)).padStart(2, "0")}:${String(timer.timeLeft % 60).padStart(2, "0")}`}
            </text>
          </svg>
        </div>
      </div>

      {/* Contador de sesiones */}
      <p className="text-center text-sm text-[#4B5563] dark:text-[#9CA3AF]">
        <span className="font-semibold text-[#F5A623]">
          {timer.sessionsCompleted}
        </span>{" "}
        sesiones completadas hoy
      </p>

      {/* Controles de audio ambiente */}
      <AmbientSoundControls
        options={ambientAudio.options}
        selectedSoundId={ambientAudio.selectedSoundId}
        selectedSoundLabel={ambientAudio.selectedSoundLabel}
        selectedSoundDescription={ambientAudio.selectedSoundDescription}
        volume={ambientAudio.volume}
        status={ambientAudio.status}
        error={ambientAudio.error}
        onSelectSound={ambientAudio.setSelectedSoundId}
        onVolumeChange={ambientAudio.setVolume}
      />

      {/* Botones de acción */}
      <div className="flex flex-col gap-3">
        {timer.state === "idle" && (
          <button
            onClick={handleStartClick}
            className="px-6 py-2 bg-[#F5A623] text-[#1C2333] font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-150 w-full"
            aria-label="Iniciar temporizador"
          >
            Iniciar
          </button>
        )}

        {timer.state === "focusing" && (
          <div className="flex gap-2">
            <button
              onClick={timer.pause}
              className="flex-1 px-6 py-2 bg-[#F7F8FA] dark:bg-[#2D3748] text-[#1C2333] dark:text-white font-semibold rounded-lg hover:bg-opacity-80 transition-all duration-150"
              aria-label="Pausar temporizador"
            >
              Pausar
            </button>
            <button
              onClick={timer.reset}
              className="flex-1 px-6 py-2 bg-[#F7F8FA] dark:bg-[#2D3748] text-[#1C2333] dark:text-white font-semibold rounded-lg hover:bg-opacity-80 transition-all duration-150"
              aria-label="Reiniciar temporizador"
            >
              Reiniciar
            </button>
          </div>
        )}

        {timer.state === "paused" && (
          <div className="flex gap-2">
            <button
              onClick={timer.resume}
              className="flex-1 px-6 py-2 bg-[#F5A623] text-[#1C2333] font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-150"
              aria-label="Reanudar temporizador"
            >
              Reanudar
            </button>
            <button
              onClick={timer.reset}
              className="flex-1 px-6 py-2 bg-[#F7F8FA] dark:bg-[#2D3748] text-[#1C2333] dark:text-white font-semibold rounded-lg hover:bg-opacity-80 transition-all duration-150"
              aria-label="Reiniciar temporizador"
            >
              Reiniciar
            </button>
          </div>
        )}

        {timer.state === "break" && (
          <button
            onClick={timer.reset}
            className="px-6 py-2 bg-[#F5A623] text-[#1C2333] font-semibold rounded-lg hover:bg-opacity-90 transition-all duration-150 w-full"
            aria-label="Siguiente sesión"
          >
            Siguiente sesión
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
