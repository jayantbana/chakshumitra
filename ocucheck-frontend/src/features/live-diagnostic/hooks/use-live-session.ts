"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import type { LiveSessionState } from "../types";
import { generateVideoToken } from "@/lib/api/endpoints";
import { useSessionStore } from "@/store/session-store";

const initial: LiveSessionState = {
  status: "idle",
  token: null,
  channelName: null,
  uid: null,
  callId: null,
  error: null,
  elapsedSeconds: 0,
};

export function useLiveSession() {
  const { userId } = useSessionStore();
  const [state, setState] = useState<LiveSessionState>(initial);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
    }, 1000);
  };

  const requestToken = useCallback(async () => {
    setState((s) => ({ ...s, status: "requesting-token", error: null }));
    try {
      const res = await generateVideoToken(userId);
      setState((s) => ({
        ...s,
        status: "ready",
        token: res.token,
        channelName: res.channel_name,
        uid: res.uid,
      }));
    } catch {
      setState((s) => ({
        ...s,
        status: "error",
        error: "Could not generate session token. Check your backend connection.",
      }));
    }
  }, [userId]);

  const startScan = useCallback(() => {
    setState((s) => ({ ...s, status: "live", elapsedSeconds: 0 }));
    startTimer();
  }, []);

  const stopScan = useCallback((callId?: string) => {
    stopTimer();
    setState((s) => ({
      ...s,
      status: callId ? "results-ready" : "analyzing",
      callId: callId ?? null,
    }));
  }, []);

  const setStatus = useCallback((status: LiveSessionState["status"]) => {
    setState((s) => ({ ...s, status }));
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    setState(initial);
  }, []);

  useEffect(() => () => stopTimer(), []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return { ...state, requestToken, startScan, stopScan, reset, formatTime, setStatus };
}