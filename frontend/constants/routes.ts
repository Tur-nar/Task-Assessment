export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: {
    root: "/dashboard",
    staff: "/dashboard/staff",
    tasks: "/dashboard/tasks",
    departments: "/dashboard/departments",
    supervisors: "/dashboard/supervisors",
    performance: "/dashboard/performance",
    targets: "/dashboard/targets",
    notifications: "/dashboard/notifications",
  },
} as const;

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  staff: "Staff",
  tasks: "Tasks",
  departments: "Departments",
  supervisors: "Supervisors",
  performance: "Performance",
  targets: "Targets",
  notifications: "Notifications",
};
