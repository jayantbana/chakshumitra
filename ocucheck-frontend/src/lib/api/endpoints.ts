import { apiClient } from "./client";
import type {
  ChatRequest,
  ChatResponse,
  UploadResponse,
  VideoTokenResponse,
  DiagnosticResult,
} from "./types";

export const sendMessage = (payload: ChatRequest) =>
  apiClient.post<ChatResponse>("/chat", payload).then((r) => r.data);

export const uploadImage = (file: File, userId: string, threadId: string) => {
  const form = new FormData();
  form.append("file", file);
  form.append("user_id", userId);
  form.append("thread_id", threadId);
  return apiClient
    .post<UploadResponse>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const generateVideoToken = (userId: string) =>
  apiClient
    .post<VideoTokenResponse>("/generate-video-token", { user_id: userId })
    .then((r) => r.data);
// In endpoints.ts — replace fetchDiagnosticResult
export const fetchDiagnosticResult = async (callId: string) => {
  try {
    // Try the real endpoint first
    const r = await apiClient.get<DiagnosticResult>(`/diagnostic-results/${callId}`);
    return r.data;
  } catch {
    // Fallback: read from the stored last scan result
    if (typeof window !== "undefined" && (window as any).__lastScanResult) {
      return (window as any).__lastScanResult as DiagnosticResult;
    }
    return { call_id: callId, condition: null, triage_status: null };
  }
};