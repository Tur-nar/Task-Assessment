# Implementation Plan: Notifications Glassmorphism Popover & Dedicated Notifications Page

Design and implement the Notifications feature with a **glassmorphism header popover**, smooth **Framer Motion animations**, optimistic UI updates, and a dedicated **`/dashboard/notifications`** page.

---

## 1. Architecture & Component Structure

### A. Header Glassmorphism Notification Popover (`NotificationPopover`)
- **Trigger**: Bell icon button in `DashboardHeader` with an animated unread badge counter (`<motion.span>` with spring pop animation).
- **Styling**: Modern glassmorphism container:
  - `backdrop-blur-xl bg-background/80 dark:bg-card/75 border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl`
  - Width: `w-80 sm:w-96`
- **Header**:
  - "Notifications" title with total unread pill.
  - "Mark all as read" button with check icon (disabled when unread count is 0).
- **Body**:
  - Scrollable notification list (max-h-[380px]) with `AnimatePresence`.
  - Color & icon mapping per notification type:
    - `task_assigned`: Blue `ClipboardList`
    - `task_completed`: Emerald `CheckCircle2`
    - `comment_added`: Purple `MessageSquare`
    - `deadline_warning`: Amber `Clock`
    - `overdue_alert`: Rose `AlertTriangle`
    - `target_update`: Indigo `Target`
  - Relative time stamp (e.g. "5m ago", "2h ago").
  - Unread blue dot indicator.
  - Quick action buttons on hover: Mark as Read (`Check`), Delete (`Trash2`).
  - Related task preview pill (links to task).
  - Empty state with animated bell when 0 notifications.
- **Footer**:
  - "View all notifications" link that navigates to `/dashboard/notifications` and closes the popover.

---

### B. Dedicated Notifications Page (`/dashboard/notifications/page.tsx`)
- **Header**: Page title, description, and "Mark all as read" button.
- **Summary Cards**:
  - Total Notifications, Unread, Task Updates, and Warnings/Alerts.
- **Filter & Search Bar**:
  - Status tabs: **All**, **Unread**, **Read**
  - Type select filter: **All types**, **Tasks**, **Comments**, **Alerts & Deadlines**, **Targets**
  - Search input for real-time filtering by title or message text.
- **Animated List**:
  - Staggered entry animation (`staggerChildren: 0.05`).
  - Individual notification items with swipe/fade deletion exit animation (`exit={{ opacity: 0, height: 0 }}`).
  - Mark read toggle and delete actions with optimistic React Query updates.

---

### C. API & Query Hook Layer
- **`frontend/lib/api/notifications.ts`**:
  - Add `deleteNotification(id: string)`
- **`frontend/hooks/use-notifications.ts`**:
  - Add `useDeleteNotification()` mutation hook with optimistic cache invalidation.
  - Keep 30-second background polling for `useUnreadNotificationCount()`.

---

## 2. Proposed File Changes

| File | Action | Description |
|---|---|---|
| `frontend/lib/api/notifications.ts` | **MODIFY** | Add `deleteNotification(id)` API call |
| `frontend/hooks/use-notifications.ts` | **MODIFY** | Add `useDeleteNotification()` hook |
| `frontend/components/dashboard/notification-popover.tsx` | **NEW** | Glassmorphism popover component for header |
| `frontend/components/dashboard/header.tsx` | **MODIFY** | Integrate `NotificationPopover` |
| `frontend/app/dashboard/notifications/page.tsx` | **NEW** | Full notifications page with search, filters & animations |

---

## 3. Visual & Animation Design (Agent Rules & Aesthetics)
- **Glassmorphism**: `backdrop-blur-xl`, semi-transparent background, subtle glow borders, and depth shadows.
- **Micro-animations**:
  - Unread badge counter pops in with `type: "spring", stiffness: 400`.
  - Notification items slide and stagger in.
  - Dismissing/deleting an item smoothly collapses with `AnimatePresence`.
  - Hover states on individual items with subtle glow and action buttons reveal.
- **Performance**:
  - Optimistic updates via TanStack React Query (`onMutate` / `onSuccess` cache invalidations).
  - Efficient client-side memoized search/filter.

---

## 4. Verification Plan

1. **Header Popover Verification**:
   - Open popover via Bell trigger. Verify glassmorphism backdrop blur in light and dark mode.
   - Test "Mark as read" for individual notifications and "Mark all as read".
   - Test "Delete" for individual notifications.
   - Click "View all notifications" to verify smooth navigation to `/dashboard/notifications`.
2. **Notifications Page Verification**:
   - Test filter tabs ("All", "Unread", "Read") and type dropdown filter.
   - Test search box with partial string matches.
   - Test empty state rendering.
3. **Build & Type Check**:
   - Run `npm run build` in `frontend/` to ensure zero compilation or TypeScript errors.
