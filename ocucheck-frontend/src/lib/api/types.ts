export interface ChatRequest {
  user_id: string;
  thread_id: string;
  message: string;
  image_id?: string;
  upload_context?: Record<string, unknown>;
  functional_test_results?: Record<string, unknown>;
  functional_test_type?: string;
}

export interface ChatResponse {
  response: string;
  thread_id: string;
  active_protocol?: string;
  triage_status?: "normal" | "monitor" | "urgent" | "emergency";
  video_stream_active?: boolean;
  call_id?: string;
}

export interface UploadResponse {
  image_id: string;
  message: string;
}

export interface VideoTokenResponse {
  token: string;
  channel_name: string;
  uid: number;
}

export interface DiagnosticResult {
  call_id: string;
  condition?: string;
  confidence?: number;
  triage_status?: "normal" | "monitor" | "urgent" | "emergency";
  recommendation?: string;
  raw?: Record<string, unknown>;
}