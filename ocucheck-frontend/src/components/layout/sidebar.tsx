"use client";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { useWorkspaceStore } from "@/store/workspace-store";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useWorkspaceStore();
  
  return (
    <WorkspaceSidebar 
      collapsed={!sidebarOpen} 
      onToggle={toggleSidebar} 
    />
  );
}