const SESSION_KEY = 'vta-visitor-session';
const EVENT_PREFIX = 'vta-event';

export function getVisitorSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = window.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
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
