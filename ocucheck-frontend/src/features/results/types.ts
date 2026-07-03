export interface DiagnosticResultData {
  call_id: string;
  condition?: string;
  confidence?: number;
  triage_status?: "normal" | "monitor" | "urgent" | "emergency";
  recommendation?: string;
  raw?: Record<string, unknown>;
}

export type PollingStatus = "idle" | "polling" | "success" | "error" | "timeout";

export interface ResultsState {
  data: DiagnosticResultData | null;
  pollingStatus: PollingStatus;
  error: string | null;
  attempts: number;
}