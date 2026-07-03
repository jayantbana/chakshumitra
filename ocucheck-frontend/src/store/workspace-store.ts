import { create } from "zustand";

type ActivePanel = "chat" | "upload" | "dashboard" | "live" | "results";
type WorkspaceMode = "idle" | "in-chat" | "in-protocol" | "uploading" | "analyzing" | "live-running" | "results-ready";

interface WorkspaceState {
  activePanel: ActivePanel;
  mode: WorkspaceMode;
  sidebarOpen: boolean;
  setActivePanel: (panel: ActivePanel) => void;
  setMode: (mode: WorkspaceMode) => void;
  toggleSidebar: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activePanel: "dashboard",
  mode: "idle",
  sidebarOpen: true,
  setActivePanel: (activePanel) => set({ activePanel }),
  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));