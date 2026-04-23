const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID as string,
}

if (!env.apiUrl) {
  throw new Error('❌ VITE_API_URL no definida en .env.local')
}

export default env