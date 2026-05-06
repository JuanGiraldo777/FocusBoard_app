import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar.tsx";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#0F1117] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0F1117]">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
