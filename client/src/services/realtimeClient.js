import { HubConnectionBuilder, HubConnectionState, HttpTransportType } from '@microsoft/signalr';
import { appConfig } from '../config/appConfig';

let accessToken = '';
let desiredZone = '';
let wantsAdminDashboard = false;

const connection = new HubConnectionBuilder()
  .withUrl(import.meta.env.VITE_SIGNALR_BASE_URL || `${appConfig.apiOrigin}/hub/notifications`, {
    accessTokenFactory: () => accessToken,
    skipNegotiation: false,
    transport: HttpTransportType.WebSockets
  })
  .withAutomaticReconnect({
    nextRetryDelayInMilliseconds: retryContext => {
      if (retryContext.previousRetryCount > 5) return null; // Abort after 5 failed attempts
      return [0, 5000, 10000, 30000][retryContext.previousRetryCount] || 30000;
    }
  })
  .build();

let startPromise = null;

export function startRealtimeClient() {
  if (connection.state === HubConnectionState.Connected) return Promise.resolve(connection);
  if (!startPromise) {
    startPromise = connection.start()
      .then(() => connection)
      .finally(() => { startPromise = null; });
  }
  return startPromise;
}

export function subscribeRealtime(eventName, handler) {
  connection.on(eventName, handler);
  void startRealtimeClient().catch((error) => {
    console.warn(`Realtime event ${eventName} is temporarily unavailable.`, error);
  });
  return () => connection.off(eventName, handler);
}

async function restoreRealtimeContext() {
  if (wantsAdminDashboard) await connection.invoke('JoinAdminDashboard');
  if (desiredZone) await connection.invoke('JoinZone', desiredZone);
}

connection.onreconnected(() => {
  void restoreRealtimeContext().catch((error) => {
    console.warn('Could not restore realtime presence context.', error);
  });
});

export async function setRealtimeAccessToken(nextToken = '') {
  if (accessToken === nextToken) return startRealtimeClient();
  accessToken = nextToken;
  if (connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
  const activeConnection = await startRealtimeClient();
  await restoreRealtimeContext();
  return activeConnection;
}

export async function joinAdminPresence(accessTokenValue = '') {
  wantsAdminDashboard = true;
  if (accessTokenValue !== accessToken) {
    await setRealtimeAccessToken(accessTokenValue);
  } else {
    await startRealtimeClient();
  }
  await connection.invoke('JoinAdminDashboard');
}

export async function leaveAdminPresence() {
  wantsAdminDashboard = false;
}

export async function setPresenceZone(zoneId) {
  desiredZone = String(zoneId ?? '').trim();
  await startRealtimeClient();
  if (desiredZone) {
    await connection.invoke('JoinZone', desiredZone);
  } else {
    await connection.invoke('LeaveZone');
  }
}

export function clearPresenceZone() {
  desiredZone = '';
  if (connection.state === HubConnectionState.Connected) {
    return connection.invoke('LeaveZone');
  }
  return Promise.resolve();
}
