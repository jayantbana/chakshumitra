import { Sidebar } from "@/components/layout/sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#0e0f11" }}
    >
      {/* Sidebar */}
      <div className="relative flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}