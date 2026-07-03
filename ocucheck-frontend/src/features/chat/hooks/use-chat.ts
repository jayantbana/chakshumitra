"use client";
import { useState, useCallback } from "react";
import type { Message, ChatState, TriageStatus } from "../types";
import { useSessionStore } from "@/store/session-store";
import { sendMessage } from "@/lib/api/endpoints";

import { create } from "zustand";

const makeId = () => Math.random().toString(36).slice(2, 10);

interface GlobalChatState extends ChatState {
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
  setContext: (protocol: string | null, triage: TriageStatus | null, video: boolean) => void;
  clearError: () => void;
}

export const useChatStore = create<GlobalChatState>((set) => ({
  messages: [],
  isLoading: false,
  activeProtocol: null,
  triageStatus: null,
  videoStreamActive: false,
  error: null,
  addMessage: (msg: Message) => set((s) => ({ messages: [...s.messages, msg], error: null })),
  setMessages: (messages: Message[]) => set({ messages }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error, isLoading: false }),
  setContext: (activeProtocol, triageStatus, videoStreamActive) => 
    set((s) => ({ 
      activeProtocol: activeProtocol ?? s.activeProtocol, 
      triageStatus: triageStatus ?? s.triageStatus, 
      videoStreamActive: videoStreamActive ?? s.videoStreamActive 
    })),
  clearError: () => set({ error: null })
}));

export function useChat(initialMessage?: string) {
  const { userId, threadId, setProtocol, setTriageStatus, setCallId, uploadResult } = useSessionStore();
  const store = useChatStore();

  const sendMsg = useCallback(
    async (content: string) => {
      if (!content.trim() || store.isLoading) return;

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      store.setLoading(true);
      store.addMessage(userMsg);

      try {
        // Build upload_context from session store if an image was analyzed
        const uploadContext = uploadResult ? {
          condition: uploadResult.condition,
          triage: uploadResult.triage,
          confidence: uploadResult.confidence,
          findings: uploadResult.findings,
          next_steps: uploadResult.nextSteps,
        } : undefined;

        const res = await sendMessage({
          user_id: userId,
          thread_id: threadId,
          message: content.trim(),
          upload_context: uploadContext,
        });

        const assistantMsg: Message = {
          id: makeId(),
          role: "assistant",
          content: res.response,
          timestamp: new Date(),
          isProtocol: !!res.active_protocol,
        };

        if (res.active_protocol) setProtocol(res.active_protocol);
        if (res.triage_status) setTriageStatus(res.triage_status);

        if (res.call_id) {
          setCallId(res.call_id);
        }

        store.setContext(res.active_protocol ?? null, res.triage_status ?? null, res.video_stream_active ?? false);
        store.setLoading(false);
        store.addMessage(assistantMsg);
        
      } catch (err) {
        store.setError("Unable to reach the server. Please check your connection.");
      }
    },
    [userId, threadId, store, setProtocol, setTriageStatus, setCallId, uploadResult]
  );

  return { ...store, sendMsg };
}