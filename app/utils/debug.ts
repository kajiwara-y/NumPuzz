export function debugLog(message: string, data?: any) {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

export function isLocalDevelopment(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost'
}
