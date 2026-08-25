export const userKeys = {
  all: ["users"] as const,
  list: (filters?: Record<string, string>) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  supervisors: () => [...userKeys.all, "supervisors"] as const,
  reportingChain: (userId: string) => [...userKeys.all, "reporting-chain", userId] as const,
  teamMembers: (supervisorId: string) => [...userKeys.all, "team-members", supervisorId] as const,
};

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters?: Record<string, string>) => [...taskKeys.all, "list", filters] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  stats: () => [...taskKeys.all, "stats"] as const,
};

export const departmentKeys = {
  all: ["departments"] as const,
  list: () => [...departmentKeys.all, "list"] as const,
  detail: (id: string) => [...departmentKeys.all, "detail", id] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: Record<string, string>) => [...notificationKeys.all, "list", filters] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const performanceKeys = {
  all: ["performance"] as const,
  list: () => [...performanceKeys.all, "list"] as const,
  me: () => [...performanceKeys.all, "me"] as const,
  department: (id: string) => [...performanceKeys.all, "department", id] as const,
};
