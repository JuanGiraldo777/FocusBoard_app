import { useTimer } from '../hooks/useTimer';
import type { TimerConfig, TimerControls } from '../types/timer';
import { useMemo, useEffect, useRef } from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 90; // Radio 90 para el círculo SVG

export function TimerDisplay({ focusDuration = 25 * 60, breakDuration = 5 * 60 }: Partial<TimerConfig>) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const timer: TimerControls = useTimer({
    focusDuration,
    breakDuration,
    onComplete: handleComplete
  });

  // Calcular currentTotal memoizado en lugar de usar useState + useEffect
  const currentTotal = useMemo(() => {
    if (timer.state === 'focusing') return focusDuration;
    if (timer.state === 'break') return breakDuration;
    return focusDuration; // idle o paused: mantener focusDuration por defecto
  }, [timer.state, focusDuration, breakDuration]);

  // Limpiar AudioContext al desmontar
  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Manejar completado de bloque (sonido + notificación)
  function handleComplete() {
    playNotificationSound();
    showSystemNotification();
  }

  // Web Audio API para notificación sonora
  async function playNotificationSound() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      const response = await fetch('/sounds/bell.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error('Error reproduciendo sonido:', err);
    }
  }

  // Notification API para notificación del sistema
  function showSystemNotification() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const isFocusComplete = timer.state === 'focusing';
    new Notification('FocusBoard: Timer Completado', {
      body: isFocusComplete 
        ? '¡Tiempo de enfoque terminado! Toma un descanso.' 
        : '¡Descanso finalizado! Vuelve a enfocar.',
      icon: '/favicon.svg'
    });
  }

  // Solicitar permiso de notificación al iniciar
  const handleStart = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => 
        console.error('Error solicitando permiso de notificación:', err)
      );
    }
    timer.start();
  };

  // Calcular progreso
  const progress = timer.timeLeft / currentTotal;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor = timer.state === 'focusing' 
    ? '#4f46e5' 
    : timer.state === 'break' 
      ? '#10b981' 
      : '#6b7280';

  // Texto del estado
  const stateTextMap: Record<string, string> = {
    idle: 'Listo para comenzar',
    focusing: 'Enfoque',
    break: 'Descanso',
    paused: 'En pausa'
  };
  const stateText = stateTextMap[timer.state] || 'Desconocido';

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 shadow-md">
      {/* Círculo de progreso SVG */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full" aria-label={`Progreso: ${Math.round(progress * 100)}%`}>
          {/* Fondo del círculo */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          {/* Progreso */}
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
          {/* Tiempo central */}
          <text
            x="100"
            y="110"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill="#1f2937"
            aria-label={`Tiempo restante: ${Math.floor(timer.timeLeft / 60)} minutos y ${timer.timeLeft % 60} segundos`}
          >
            {`${String(Math.floor(timer.timeLeft / 60)).padStart(2, '0')}:${String(timer.timeLeft % 60).padStart(2, '0')}`}
          </text>
        </svg>
      </div>

      {/* Estado actual */}
      <p className="text-center text-gray-600 mb-4 capitalize" aria-label={`Estado actual: ${stateText}`}>
        {stateText}
      </p>

      {/* Sesiones completadas */}
      <p className="text-center text-gray-600 mb-6">
        Sesiones completadas: {timer.sessionsCompleted}
      </p>

      {/* Controles */}
      <div className="flex flex-wrap gap-3 justify-center">
        {timer.state === 'idle' && (
          <button
            onClick={handleStart}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition w-full sm:w-auto"
            aria-label="Iniciar temporizador"
          >
            Comenzar
          </button>
        )}

        {timer.state === 'focusing' && (
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

        {timer.state === 'paused' && (
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

        {timer.state === 'break' && (
          <button
            onClick={timer.reset}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition w-full sm:w-auto"
            aria-label="Siguiente sesión"
          >
            Siguiente Sesión
          </button>
        )}
      </div>
    </div>
  );
}
