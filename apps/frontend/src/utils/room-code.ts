export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8);
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-F0-9]{8}$/.test(code);
}
