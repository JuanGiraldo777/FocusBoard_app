import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AMBIENT_SOUND_OPTIONS,
  getAmbientSoundOption,
  loadAmbientAudioPreference,
  normalizeAmbientVolume,
  saveAmbientAudioPreference,
  type AmbientAudioStatus,
  type AmbientSoundId,
} from "../services/ambient-audio.service";

interface UseAmbientAudioReturn {
  selectedSoundId: AmbientSoundId;
  volume: number;
  status: AmbientAudioStatus;
  error: string | null;
  selectedSoundLabel: string;
  selectedSoundDescription: string;
  options: typeof AMBIENT_SOUND_OPTIONS;
  setSelectedSoundId: (soundId: AmbientSoundId) => void;
  setVolume: (volume: number) => void;
}

export function useAmbientAudio(
  isSessionActive: boolean,
): UseAmbientAudioReturn {
  const initialPreference = useMemo(() => loadAmbientAudioPreference(), []);
  const [selectedSoundId, setSelectedSoundIdState] = useState<AmbientSoundId>(
    initialPreference.soundId,
  );
  const [volume, setVolumeState] = useState<number>(initialPreference.volume);
  const [status, setStatus] = useState<AmbientAudioStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeSoundIdRef = useRef<AmbientSoundId>(selectedSoundId);
  const activeSourceRef = useRef<string>("");

  const selectedSound = useMemo(
    () => getAmbientSoundOption(selectedSoundId),
    [selectedSoundId],
  );

  const syncPreference = useCallback(
    (nextSoundId: AmbientSoundId, nextVolume: number) => {
      saveAmbientAudioPreference({
        soundId: nextSoundId,
        volume: nextVolume,
      });
    },
    [],
  );

  const ensureAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(selectedSound.src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = volume;
      audioRef.current = audio;
      activeSourceRef.current = selectedSound.src;
    }

    return audioRef.current;
  }, [selectedSound.src, volume]);

  const playAmbientAudio = useCallback(async () => {
    const audio = ensureAudioElement();

    try {
      setError(null);
      setStatus("loading");
      audio.loop = true;
      audio.volume = volume;

      if (activeSourceRef.current !== selectedSound.src) {
        audio.pause();
        audio.src = selectedSound.src;
        audio.load();
        activeSourceRef.current = selectedSound.src;
      }

      await audio.play();
      setStatus("playing");
    } catch (playError) {
      console.error("Error playing ambient audio:", playError);
      setError(
        "No se pudo reproducir el sonido. Interactúa con la página e inténtalo de nuevo.",
      );
      setStatus("error");
    }
  }, [ensureAudioElement, selectedSound.src, volume]);

  const pauseAmbientAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      setStatus("idle");
      return;
    }

    audio.pause();
    setStatus("paused");
  }, []);

  const setSelectedSoundId = useCallback(
    (soundId: AmbientSoundId) => {
      setSelectedSoundIdState(soundId);
      activeSoundIdRef.current = soundId;
      syncPreference(soundId, volume);
    },
    [syncPreference, volume],
  );

  const setVolume = useCallback(
    (nextVolume: number) => {
      const normalizedVolume = normalizeAmbientVolume(nextVolume);
      setVolumeState(normalizedVolume);
      syncPreference(activeSoundIdRef.current, normalizedVolume);

      if (audioRef.current) {
        audioRef.current.volume = normalizedVolume;
      }
    },
    [syncPreference],
  );

  useEffect(() => {
    const audio = ensureAudioElement();
    audio.loop = true;
    audio.volume = volume;

    if (activeSourceRef.current !== selectedSound.src) {
      audio.pause();
      audio.src = selectedSound.src;
      audio.load();
      activeSourceRef.current = selectedSound.src;
    }

    if (isSessionActive) {
      void playAmbientAudio();
    } else {
      pauseAmbientAudio();
    }
  }, [
    ensureAudioElement,
    isSessionActive,
    pauseAmbientAudio,
    playAmbientAudio,
    selectedSound.src,
    volume,
  ]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    selectedSoundId,
    volume,
    status,
    error,
    selectedSoundLabel: selectedSound.label,
    selectedSoundDescription: selectedSound.description,
    options: AMBIENT_SOUND_OPTIONS,
    setSelectedSoundId,
    setVolume,
  };
}
