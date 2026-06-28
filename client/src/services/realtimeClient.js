import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { appConfig } from '../config/appConfig';

const connection = new HubConnectionBuilder()
  .withUrl(`${appConfig.apiBaseUrl.replace(/\/api\/?$/, '')}/hub/notifications`)
  .withAutomaticReconnect()
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
