"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { DiagnosticResultData, ResultsState } from "../types";
import { fetchDiagnosticResult } from "@/lib/api/endpoints";

const MAX_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3000;

export function useDiagnosticResults(callId: string | null) {
  const [state, setState] = useState<ResultsState>({
    data: null,
    pollingStatus: "idle",
    error: null,
    attempts: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const poll = useCallback(async () => {
    if (!callId) return;

    attemptsRef.current += 1;

    if (attemptsRef.current > MAX_ATTEMPTS) {
      setState((s) => ({
        ...s,
        pollingStatus: "timeout",
        error: "Results are taking longer than expected. Please try again.",
      }));
      return;
    }

    try {
      const result = await fetchDiagnosticResult(callId);

      if (result && (result.condition || result.triage_status)) {
        setState({
          data: result,
          pollingStatus: "success",
          error: null,
          attempts: attemptsRef.current,
        });
        return;
      }

      // Still processing — schedule next poll
      setState((s) => ({ ...s, attempts: attemptsRef.current }));
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    } catch {
      setState((s) => ({
        ...s,
        pollingStatus: "error",
        error: "Could not retrieve results. Check your backend connection.",
      }));
    }
  }, [callId]);

  useEffect(() => {
    if (!callId) return;
    attemptsRef.current = 0;
    setState({ data: null, pollingStatus: "polling", error: null, attempts: 0 });
    timerRef.current = setTimeout(poll, 500);
    return () => clearTimer();
  }, [callId, poll]);

  const retry = useCallback(() => {
    if (!callId) return;
    attemptsRef.current = 0;
    setState({ data: null, pollingStatus: "polling", error: null, attempts: 0 });
    timerRef.current = setTimeout(poll, 500);
  }, [callId, poll]);

  return { ...state, retry };
}