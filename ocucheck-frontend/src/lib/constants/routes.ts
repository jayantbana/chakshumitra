export const ROUTES = {
  home:        "/",
  howItWorks:  "/how-it-works",
  about:       "/about",
  privacy:     "/privacy",
  workspace:   "/app",
  assessment:  "/app/assessment",
  live:        "/app/live",
  results:     (caseId: string) => `/app/results/${caseId}`,
  history:     "/app/history",
} as const;