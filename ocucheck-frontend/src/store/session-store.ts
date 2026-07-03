import { create } from "zustand";
import { useChatStore } from "@/features/chat/hooks/use-chat";

interface UploadResult {
  condition: string;
  triage: string;
  confidence: number;
  findings: string[];
  nextSteps: string[];
}

interface SessionState {
  userId: string;
  threadId: string;
  caseId: string | null;
  activeProtocol: string | null;
  triageStatus: "normal" | "monitor" | "urgent" | "emergency" | null;
  callId: string | null;
  uploadResult: UploadResult | null;
  setSession: (userId: string, threadId: string) => void;
  setProtocol: (protocol: string | null) => void;
  setTriageStatus: (status: SessionState["triageStatus"]) => void;
  setCaseId: (id: string | null) => void;
  setCallId: (id: string | null) => void;
  setUploadResult: (uploadResult: UploadResult | null) => void;
  clearUploadResult: () => void;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useSessionStore = create<SessionState>((set) => ({
  userId: generateId(),
  threadId: generateId(),
  caseId: null,
  activeProtocol: null,
  triageStatus: null,
  callId: null,
  uploadResult: null,
  setSession: (userId, threadId) => set({ userId, threadId }),
  setProtocol: (activeProtocol) => set({ activeProtocol }),
  setTriageStatus: (triageStatus) => set({ triageStatus }),
  setCaseId: (caseId) => set({ caseId }),
  setCallId: (callId) => set({ callId }),
  setUploadResult: (uploadResult) => set({ uploadResult }),
  clearUploadResult: () => set({ uploadResult: null, callId: null }),
  reset: () => {
    useChatStore.getState().clearError();
    useChatStore.setState({ messages: [], isLoading: false, activeProtocol: null, triageStatus: null, videoStreamActive: false });
    set({ caseId: null, activeProtocol: null, triageStatus: null, threadId: generateId(), callId: null, uploadResult: null });
  },
}));