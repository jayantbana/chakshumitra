export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isProtocol?: boolean;
}

export type TriageStatus = "normal" | "monitor" | "urgent" | "emergency" | null;

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  activeProtocol: string | null;
  triageStatus: TriageStatus;
  videoStreamActive: boolean;
  error: string | null;
}