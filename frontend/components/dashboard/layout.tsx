"use client";

import { AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SessionLoader } from "@/components/shared/session-loader";
import { useAuthHydration, useRequireAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const hydrated = useAuthHydration();
  const { isAuthenticated } = useRequireAuth();

  // Show session loader while hydrating
  if (!hydrated) {
    return (
      <AnimatePresence>
        <SessionLoader />
      </AnimatePresence>
    );
  }

  // Don't render layout if not authenticated (useRequireAuth redirects)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
