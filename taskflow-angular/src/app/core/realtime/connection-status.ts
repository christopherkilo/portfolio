export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "online"
  | "reconnecting"
  | "offline"
  | "failed";

export const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  online: "Online",
  connected: "Online",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
  failed: "Connection failed",
};

export function displayConnectionStatus(status: ConnectionStatus): string {
  return CONNECTION_LABELS[status] ?? status;
}
