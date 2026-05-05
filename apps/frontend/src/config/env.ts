const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

if (!configuredApiUrl) {
  throw new Error('❌ VITE_API_URL no definida en .env.local');
}

const normalizeLocalApiUrl = (urlValue: string): string => {
  try {
    const parsed = new URL(urlValue);
    const currentHost = window.location.hostname;
    const isLocalPair =
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      (currentHost === "localhost" || currentHost === "127.0.0.1");

    if (import.meta.env.DEV && isLocalPair && parsed.hostname !== currentHost) {
      parsed.hostname = currentHost;
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    // Si la URL no se puede parsear, se usa el valor original
  }

  return urlValue;
};

const env = {
  apiUrl: normalizeLocalApiUrl(configuredApiUrl),
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
};

export default env;