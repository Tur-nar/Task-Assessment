# Landing Page — TaskManager Pro

Build a premium, modern landing page that replaces the current redirect-to-login at `app/page.tsx`. The page showcases TaskManager Pro's graph-powered capabilities using the existing `AgentBentoGrid` component (re-themed for task management) with scroll-driven animations, and matches the established design language (Poppins, oklch monochrome palette, Framer Motion + GSAP).

## User Review Required

> [!IMPORTANT]
> **Bento Grid Adaptation**: The existing `agent-bento-grid.tsx` is themed for an AI agent workspace (pipeline, token monitor, activity feed, knowledge base, tool inspector). I'll create a **new** `task-bento-grid.tsx` that reuses the `FeatCard` shell but replaces the 5 card visuals with TaskManager Pro-relevant content:
> 
> | Card | Was (Agent) | Becomes (TaskManager Pro) |
> |------|-------------|---------------------------|
> | Card 1 (1×1) | Agent Pipeline node graph | **Dependency Graph** — animated task nodes connected by `DEPENDS_ON` relationships with status-colored edges |
> | Card 2 (1×1) | Token/Cost Monitor bars | **Performance Analytics** — animated bar chart of team scores + sparkline stat cards |
> | Card 3 (1×1) | Activity Feed stack | **Live Notifications** — stacked notification cards (task assigned, overdue alerts, completed) |
> | Card 4 (2×1) | Knowledge Base namespaces | **Department Overview** — department bars with member counts + recent task log |
> | Card 5 (1×1) | Tool Call Inspector | **Task Status Board** — 4-tile grid showing status counts (completed, in progress, overdue, not started) |

> [!IMPORTANT]
> **Page sections & flow** (scroll order):
> 1. **Sticky Nav** — Logo + "TaskManager Pro" + theme toggle + "Sign in" button
> 2. **Hero** — FlipFadeText headline cycling task verbs, floating graph nodes background (reused from login), two CTAs
> 3. **Features Bento Grid** — The 5-card task-bento-grid with staggered scroll-reveal
> 4. **Why Graph?** — 3-column feature cards explaining graph advantages (multi-hop traversal, dependency detection, reporting chains)
> 5. **Footer CTA** — Final call-to-action banner + minimal footer

## Open Questions

> [!NOTE]
> **None blocking** — all design decisions are derived from the existing codebase patterns (login page, dashboard, AGENTS.md). I'll proceed with the above unless you redirect.

---

## Proposed Changes

### Landing Page Components

#### [NEW] [`task-bento-grid.tsx`](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/frontend/components/ui/task-bento-grid.tsx)

New 5-card bento grid component adapted from the agent-bento-grid pattern:

- **Imports**: Reuses `FeatCard` from `agent-bento-grid.tsx` for consistent card styling
- **TaskCard1 (Dependency Graph)**: SVG node graph with 5 task nodes (`Request`, `Design`, `Build`, `Test`, `Deploy`) connected by animated `DEPENDS_ON` edges. Active step cycles through nodes highlighting the dependency chain with colored flow paths — directly maps to the app's task dependency feature
- **TaskCard2 (Performance)**: Animated bar chart showing per-day team performance scores, with two stat cards ("Completion Rate" / "Avg Score") that slide on hover/cycle. Same pattern as Card2 in agent-bento but with task-relevant data
- **TaskCard3 (Notifications)**: Stacked infinite-scroll feed of notification cards (task assigned, deadline approaching, task completed, overdue alert). Cycles through items with spring animations — mirrors Card3 pattern
- **TaskCard4 (Department Overview)**: Left panel shows department namespace bars (Engineering, Marketing, HR, Finance) with member counts and animated fill. Right panel shows a rolling "Recent Tasks" log. Same split-panel pattern as Card4
- **TaskCard5 (Status Board)**: 2×2 grid of status tiles (Completed, In Progress, Overdue, Not Started) with colored gradient icons and animated progress bars. Same pattern as Card5

Grid layout: `3-col top (Card1, Card2, Card3) + 2-col bottom (Card4 spans 2, Card5 spans 1)` — identical to agent-bento-grid.

---

### Landing Page Route

#### [MODIFY] [`page.tsx`](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/frontend/app/page.tsx)

Replace the 6-line redirect with a full landing page (~400 lines):

**Section 1 — Sticky Navigation:**
- Glassmorphic sticky nav (`backdrop-blur-xl`, `bg-background/80`)
- Left: "TaskManager Pro" text logo (matching login page branding)
- Right: `ThemeToggle` + "Sign in" `Button` linking to `/login`
- Framer Motion `useScroll` + `useTransform` for border-bottom reveal on scroll

**Section 2 — Hero:**
- Full-viewport height section
- Background: `FloatingNodes` SVG animation (extracted and shared from login page as a new shared component)
- Center: `FlipFadeText` cycling `["ORGANIZING", "TRACKING", "COLLABORATING", "DELIVERING", "ACHIEVING"]` (same words as login)
- Subtitle: "Enterprise task management powered by graph intelligence"
- Two CTAs: "Get Started" (primary, links `/login`) + "Learn More" (outline, scrolls to features)
- Staggered fade-in with Framer Motion

**Section 3 — Features Bento Grid:**
- Section heading: "Everything you need to manage at scale"
- `TaskBentoGrid` component rendered with `whileInView` scroll-triggered stagger animation
- Fade + slide-up on each card using Framer Motion `viewport` prop

**Section 4 — Why Graph?**
- Section heading: "Why a graph database?"
- 3 feature cards in a responsive grid:
  1. **Multi-hop Traversal** — "See the full reporting chain from any staff member to the top in one query"
  2. **Dependency Intelligence** — "Detect transitive blockers across tasks — know what's really blocking progress"
  3. **Team Visibility** — "Navigate departments, supervisors, and targets through natural relationship paths"
- Each card: icon, title, description, subtle border + hover glow effect
- `whileInView` stagger entrance

**Section 5 — Footer CTA + Footer:**
- Full-width dark banner: "Ready to transform how your team works?" + CTA button
- Minimal footer: © TaskManager Pro, built with CognoDB

---

### Shared Component Extraction

#### [NEW] [`floating-nodes.tsx`](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/frontend/components/shared/floating-nodes.tsx)

Extract the `FloatingNodes` component from the login page into a shared component so both the landing page hero and login page can use it without duplication.

- Moves `STATIC_NODES`, `NODE_CONNECTIONS`, and `FloatingNodes` function from `login/page.tsx`
- Exports as named export
- Accepts optional `className` and `opacity` props

#### [MODIFY] [`login/page.tsx`](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/frontend/app/login/page.tsx)

- Remove inline `FloatingNodes`, `STATIC_NODES`, and `NODE_CONNECTIONS`
- Import `FloatingNodes` from `@/components/shared/floating-nodes`
- Zero visual change

---

## Verification Plan

### Manual Verification
- Navigate to `http://localhost:3000` — should show landing page (not redirect to login)
- Verify all 5 sections render with animations
- Test dark/light theme toggle on the landing page
- Test "Sign in" button navigates to `/login`
- Test responsive layout on mobile viewport
- Verify login page still works identically after FloatingNodes extraction
- Check bento grid animations play smoothly (no jank)

### Build Check
```bash
cd frontend && npm run build
```
Confirms no TypeScript errors or missing imports.
