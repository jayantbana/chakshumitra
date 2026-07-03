export type LiveSessionStatus =
  | "idle"
  | "requesting-token"
  | "ready"
  | "live"
  | "analyzing"
  | "results-ready"
  | "error";

export interface LiveSessionState {
  status: LiveSessionStatus;
  token: string | null;
  channelName: string | null;
  uid: number | null;
  callId: string | null;
  error: string | null;
  elapsedSeconds: number;
}