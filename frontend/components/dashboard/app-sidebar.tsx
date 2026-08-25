"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  Shield,
  BarChart3,
  Target,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

const mainNav = [
  {
    title: "Dashboard",
    href: ROUTES.dashboard.root,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Staff",
    href: ROUTES.dashboard.staff,
    icon: Users,
  },
  {
    title: "Tasks",
    href: ROUTES.dashboard.tasks,
    icon: ClipboardList,
    disabled: true,
  },
  {
    title: "Departments",
    href: ROUTES.dashboard.departments,
    icon: Building2,
  },
  {
    title: "Supervisors",
    href: ROUTES.dashboard.supervisors,
    icon: Shield,
  },
];

const analyticsNav = [
  {
    title: "Performance",
    href: ROUTES.dashboard.performance,
    icon: BarChart3,
    disabled: true,
  },
  {
    title: "Targets",
    href: ROUTES.dashboard.targets,
    icon: Target,
    disabled: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin"
        ? "Admin"
        : user?.role === "supervisor"
          ? "Supervisor"
          : "Staff";

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={ROUTES.dashboard.root} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <span className="text-xs font-bold">TM</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">TaskManager</span>
                <span className="truncate text-xs text-muted-foreground">
                  Pro Edition
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <SidebarMenuItem key={item.href}>
                    {item.disabled ? (
                      <SidebarMenuButton
                        tooltip={item.title}
                        disabled
                        className="opacity-40 cursor-not-allowed"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] px-1.5 py-0"
                        >
                          Soon
                        </Badge>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.title}
                        className="relative"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-md bg-sidebar-accent"
                            style={{ zIndex: -1 }}
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }}
                          />
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    disabled={item.disabled}
                    className="opacity-40 cursor-not-allowed"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0"
                    >
                      Soon
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
