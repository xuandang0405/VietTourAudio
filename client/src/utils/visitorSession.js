const SESSION_KEY = 'vta-visitor-session';
const EVENT_PREFIX = 'vta-event';

let inMemorySessionId = null;

export function getVisitorSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }
  } catch (e) {
    console.warn('LocalStorage is blocked or disabled:', e);
  }

  if (inMemorySessionId) {
    return inMemorySessionId;
  }

  const sessionId = window.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  try {
    window.localStorage.setItem(SESSION_KEY, sessionId);
  } catch (e) {
    console.warn('Failed to save visitor session to LocalStorage:', e);
  }

  inMemorySessionId = sessionId;
  return sessionId;
}

export function markEventOnce(eventType, eventId) {
  const key = `${EVENT_PREFIX}:${getVisitorSessionId()}:${eventType}:${eventId}`;
  if (window.sessionStorage.getItem(key)) {
    return false;
  }

  window.sessionStorage.setItem(key, new Date().toISOString());
  return true;
}
