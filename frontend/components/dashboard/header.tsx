"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTE_LABELS } from "@/constants/routes";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

export function DashboardHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();

  // Build breadcrumb segments from the pathname
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => ({
      label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: "/" + arr.slice(0, index + 1).join("/"),
      isLast: index === arr.length - 1,
    }));

  // Fetch unread notification count
  const { data: unreadCount } = useUnreadNotificationCount();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {segments.map((segment, i) => (
            <BreadcrumbItem key={segment.href}>
              {i > 0 && <BreadcrumbSeparator />}
              {segment.isLast ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={segment.href} />}>
                  {segment.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative size-9 rounded-full">
          <Bell className="size-4" />
          <AnimatePresence>
            {typeof unreadCount === "number" && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative size-9 rounded-full" />}>
            <Avatar className="size-8">
              <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
