"use client";
import { AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SessionLoader } from "@/components/shared/session-loader";
import { useRequireAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <AnimatePresence>
        <SessionLoader />
      </AnimatePresence>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
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
