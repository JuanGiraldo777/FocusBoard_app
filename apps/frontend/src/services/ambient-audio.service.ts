export type AmbientSoundId = "lluvia" | "rain" | "cafeteria" | "naturaleza";

export type AmbientAudioStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error";

export interface AmbientAudioPreference {
  soundId: AmbientSoundId;
  volume: number;
}

export interface AmbientSoundOption {
  id: AmbientSoundId;
  label: string;
  description: string;
  src: string;
}

const STORAGE_KEY = "focusboard:ambient-audio";
const DEFAULT_VOLUME = 0.4;
const DEFAULT_SOUND_ID: AmbientSoundId = "lluvia";

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  {
    id: "lluvia",
    label: "Lluvia",
    description: "Lluvia suave para concentrarte",
    src: "/sounds/lluvia.mp3",
  },
  {
    id: "rain",
    label: "Rain",
    description: "Sonido de lluvia en inglés",
    src: "/sounds/rain.mp3",
  },
  {
    id: "cafeteria",
    label: "Cafetería",
    description: "Ruido ambiente con energía suave",
    src: "/sounds/cafeteria.mp3",
  },
  {
    id: "naturaleza",
    label: "Naturaleza",
    description: "Sonidos naturales para foco profundo",
    src: "/sounds/naturaleza.mp3",
  },
];

function isAmbientSoundId(value: string): value is AmbientSoundId {
  return AMBIENT_SOUND_OPTIONS.some((option) => option.id === value);
}

function clampVolume(volume: number): number {
  if (Number.isNaN(volume)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, volume));
}

export function getAmbientSoundOption(
  soundId: AmbientSoundId,
): AmbientSoundOption {
  return (
    AMBIENT_SOUND_OPTIONS.find((option) => option.id === soundId) ??
    AMBIENT_SOUND_OPTIONS[0]
  );
}

export function loadAmbientAudioPreference(): AmbientAudioPreference {
  try {
    const rawPreference = localStorage.getItem(STORAGE_KEY);

    if (!rawPreference) {
      return {
        soundId: DEFAULT_SOUND_ID,
        volume: DEFAULT_VOLUME,
      };
    }

    const parsed = JSON.parse(rawPreference) as Partial<AmbientAudioPreference>;
    const soundId =
      typeof parsed.soundId === "string" && isAmbientSoundId(parsed.soundId)
        ? parsed.soundId
        : DEFAULT_SOUND_ID;
    const volume = clampVolume(
      typeof parsed.volume === "number" ? parsed.volume : DEFAULT_VOLUME,
    );

    return {
      soundId,
      volume,
    };
  } catch {
    return {
      soundId: DEFAULT_SOUND_ID,
      volume: DEFAULT_VOLUME,
    };
  }
}

export function saveAmbientAudioPreference(
  preference: AmbientAudioPreference,
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // No bloquear la experiencia si localStorage falla.
  }
}

export function normalizeAmbientVolume(volume: number): number {
  return clampVolume(volume);
}
