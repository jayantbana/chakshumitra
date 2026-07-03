"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UploadState } from "../types";
import { uploadImage, sendMessage } from "@/lib/api/endpoints";
import { useSessionStore } from "@/store/session-store";
import { useChatStore } from "@/features/chat/hooks/use-chat";
import type { Message } from "@/features/chat/types";
import { ROUTES } from "@/lib/constants/routes";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE_MB = 10;

const initial: UploadState = {
  status: "idle",
  file: null,
  preview: null,
  imageId: null,
  progress: 0,
  error: null,
  message: null,
};

export function useUpload() {
  const router = useRouter();
  const { userId, threadId, setCallId } = useSessionStore();
  const [state, setState] = useState<UploadState>(initial);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WebP images are supported.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Image must be smaller than ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const selectFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState((s) => ({ ...s, status: "error", error }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      status: "idle",
      file,
      preview,
      imageId: null,
      error: null,
      message: null,
      progress: 0,
    }));
  }, []);

  const upload = useCallback(async () => {
    if (!state.file) return;
    setState((s) => ({ ...s, status: "uploading", progress: 10, error: null }));

    try {
      setState((s) => ({ ...s, progress: 40 }));
      const res = await uploadImage(state.file, userId, threadId);
      setState((s) => ({
        ...s,
        status: "analyzing",
        imageId: res.image_id,
        message: res.message,
        progress: 80,
      }));
      
      // Trigger backend AI analysis on the image
      const chatRes = await sendMessage({
        user_id: userId,
        thread_id: threadId,
        message: "", 
        image_id: res.image_id,
      });

      setState((s) => ({ ...s, status: "success", progress: 100 }));
      
      // Inject the interaction directly into the global chat store so it's ready when bridging to "Continue in chat"
      const makeId = () => Math.random().toString(36).slice(2, 10);
      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: "Attached an image of my eye for analysis.",
        timestamp: new Date(),
      };
      const assistantMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: chatRes.response,
        timestamp: new Date(),
        isProtocol: !!chatRes.active_protocol,
      };
      const chatStore = useChatStore.getState();
      chatStore.addMessage(userMsg);
      chatStore.addMessage(assistantMsg);
      chatStore.setContext(
        chatRes.active_protocol ?? null,
        chatRes.triage_status ?? null,
        chatRes.video_stream_active ?? false
      );

      if (chatRes.call_id) {
        setCallId(chatRes.call_id);
        
        // Mock a last scan result to ensure it displays immediately if backend webhook buffers
        if (typeof window !== "undefined") {
          (window as any).__lastScanResult = {
            call_id: chatRes.call_id,
            condition: chatRes.active_protocol ?? "Eye condition detected from image",
            triage_status: chatRes.triage_status ?? "monitor",
            recommendation: chatRes.response,
          };
        }
        router.push(ROUTES.results(chatRes.call_id));
      }
    } catch (err: unknown) {
      let errorMsg = "Upload or analysis failed. Please check your connection and try again.";
      
      // Provide more specific error messages
      if (err && typeof err === "object") {
        const axiosErr = err as { code?: string; message?: string; response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.code === "ECONNABORTED" || axiosErr.message?.includes("timeout")) {
          errorMsg = "The AI analysis is taking longer than expected. The model may be loading — please try again in a moment.";
        } else if (axiosErr.code === "ERR_NETWORK" || axiosErr.message?.includes("Network Error")) {
          errorMsg = "Cannot reach the backend server. Please make sure the backend is running on port 8000.";
        } else if (axiosErr.response?.status === 500) {
          const detail = axiosErr.response?.data?.detail;
          errorMsg = detail ? `Server error: ${detail}` : "The backend encountered an internal error. Check the server logs.";
        } else if (axiosErr.response?.status === 400) {
          errorMsg = axiosErr.response?.data?.detail ?? "Invalid file type. Please upload a JPEG, PNG, or WebP image.";
        }
      }
      
      setState((s) => ({
        ...s,
        status: "error",
        progress: 0,
        error: errorMsg,
      }));
    }
  }, [state.file, userId, threadId, setCallId, router]);

  const reset = useCallback(() => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setState(initial);
  }, [state.preview]);

  const setDragover = (over: boolean) =>
    setState((s) => ({ ...s, status: over ? "dragover" : "idle" }));

  return { ...state, selectFile, upload, reset, setDragover };
}