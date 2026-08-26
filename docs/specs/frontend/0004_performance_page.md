# Performance Analytics Dashboard

Add a fully animated, role-scoped performance analytics page with Recharts charts. Backend APIs already exist at `/api/performance`. This plan covers the frontend only.

---

## Scope: What each role sees

| Role | Data shown |
|---|---|
| `staff` | Personal metrics card only (score, rating, task breakdown) |
| `supervisor` | Personal card + team leaderboard (own subordinates from `GET /api/performance` — backend already filters) |
| `admin` / `super_admin` | Full org leaderboard (all users from `GET /api/performance`) + department selector |

> [!IMPORTANT]
> The backend already enforces role scoping on `GET /api/performance` (guards: `super_admin`, `admin`, `supervisor`). Staff can only call `GET /api/performance/me`. We mirror this in the UI: staff never call the list endpoint.

---

## Proposed Changes

### 1. API lib — `frontend/lib/api/performance.ts` [NEW]

Three functions:
- `getAllPerformance()` → `GET /api/performance` → `PerformanceRecord[]`
- `getMyPerformance()` → `GET /api/performance/me` → `PerformanceRecord`
- `getDepartmentPerformance(id)` → `GET /api/performance/department/:id` → `PerformanceRecord[]`

---

### 2. React Query hook — `frontend/hooks/use-performance.ts` [NEW]

- `useAllPerformance()` — calls `getAllPerformance`, enabled only when role is not `staff`
- `useMyPerformance()` — calls `getMyPerformance`, always enabled
- `useDepartmentPerformance(id)` — calls `getDepartmentPerformance(id)`, enabled when id present

---

### 3. Performance page — `frontend/app/dashboard/performance/page.tsx` [NEW]

Single page that branches on role:

**All roles — Personal Score Card (top of page)**
- Animated score ring/radial bar (Recharts `RadialBarChart`)
- Stat pills: Total Assigned / Completed / On-Time / Late / Overdue
- Rating badge with color coding (Excellent → green, Good → blue, Average → amber, Needs Improvement → red)
- Framer Motion `staggerChildren` entrance

**Supervisor / Admin / Super Admin — Team Leaderboard Section**
- `BarChart` (Recharts) showing `performanceScore` per team member, sorted descending
- Each bar colored by rating tier (green/blue/amber/red)
- Hover tooltip: name, score, tasks completed, rating
- For admin/super_admin: department filter `<Select>` above the chart — switching calls `useDepartmentPerformance`
- Animated bar entrance via `animationBegin` + `animationDuration` on Recharts

**Admin / Super Admin — Additional Charts**
- `PieChart` showing task completion breakdown (on-time, completed late, overdue) across all staff — aggregated from the list
- Score distribution `AreaChart` (score on Y, users sorted on X) to visualise spread
- These charts fade in as separate motion.div sections

---

### 4. Sidebar nav link — `frontend/components/dashboard/app-sidebar.tsx` [MODIFY]

Add a "Performance" nav item (icon: `TrendingUp` from lucide-react) pointing to `/dashboard/performance`. Show for all roles (staff see their own, others see more).

---

### 5. Types — `frontend/types/api.ts` [ALREADY EXISTS]

`PerformanceRecord` is already defined. No changes needed.

---

### 6. Query keys — `frontend/constants/query-keys.ts` [ALREADY EXISTS]

`performanceKeys` already defined. No changes needed.

---

## Libraries

- **Recharts** — already the right fit for this stack (React-native, composable, animation built-in). Install with `npm install recharts`.
- **Framer Motion** — already installed in the project.

---

## Animation priorities (as requested)

1. Score ring counts up from 0 on mount (`RadialBarChart` `animationBegin=0`, `animationDuration=1200`)
2. Stats pills stagger in with `framer-motion` `staggerChildren: 0.07`
3. Leaderboard bars animate in sequentially via Recharts built-in bar animation
4. Page sections use `framer-motion` `initial={{ opacity:0, y:24 }}` → `animate={{ opacity:1, y:0 }}`
5. Rating badge pops with a spring scale animation on first render

---

## File List

| File | Action |
|---|---|
| `frontend/lib/api/performance.ts` | **NEW** |
| `frontend/hooks/use-performance.ts` | **NEW** |
| `frontend/app/dashboard/performance/page.tsx` | **NEW** |
| `frontend/components/dashboard/app-sidebar.tsx` | **MODIFY** — add nav link |

---

## Verification Plan

1. Run `npm run build` in `frontend/` — zero TS errors.
2. Visually test as `staff` → only personal card visible.
3. Visually test as `supervisor` → personal + team bar chart visible.
4. Visually test as `admin` → full leaderboard + department filter + pie/area charts.
5. Confirm all chart animations play on mount.
