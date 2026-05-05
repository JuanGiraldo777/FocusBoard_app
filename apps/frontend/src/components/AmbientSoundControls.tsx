import type {
  AmbientAudioStatus,
  AmbientSoundId,
  AmbientSoundOption,
} from "../services/ambient-audio.service.ts";

interface AmbientSoundControlsProps {
  options: AmbientSoundOption[];
  selectedSoundId: AmbientSoundId;
  selectedSoundLabel: string;
  selectedSoundDescription: string;
  volume: number;
  status: AmbientAudioStatus;
  error: string | null;
  onSelectSound: (soundId: AmbientSoundId) => void;
  onVolumeChange: (volume: number) => void;
}

const statusLabelMap: Record<AmbientAudioStatus, string> = {
  idle: "Detenido",
  loading: "Cargando",
  playing: "Reproduciendo",
  paused: "En pausa",
  error: "Error",
};

export function AmbientSoundControls({
  options,
  selectedSoundId,
  selectedSoundLabel,
  selectedSoundDescription,
  volume,
  status,
  error,
  onSelectSound,
  onVolumeChange,
}: AmbientSoundControlsProps) {
  return (
    <section className="mt-8 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Sonido ambiente
          </p>
          <h3 className="text-lg font-bold text-gray-900">
            {selectedSoundLabel}
          </h3>
          <p className="text-sm text-gray-600">{selectedSoundDescription}</p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          {statusLabelMap[status]}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isActive = option.id === selectedSoundId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectSound(option.id)}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50"
              }`}
            >
              <p className="text-base font-semibold text-gray-900">
                {option.label}
              </p>
              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <span className="font-medium">Volumen</span>
          <span className="font-semibold text-indigo-600">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="mt-3 w-full cursor-pointer accent-indigo-600"
          aria-label="Control de volumen del sonido ambiente"
        />
      </div>
    </section>
  );
}
