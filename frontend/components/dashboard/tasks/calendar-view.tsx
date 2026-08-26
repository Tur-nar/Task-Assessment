"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type ToolbarProps,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskWithRelations } from "@/types/api";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Priority colour mapping for calendar events
const PRIORITY_COLORS: Record<string, { bg: string; border: string }> = {
  low: { bg: "#6366f1", border: "#4f46e5" },
  medium: { bg: "#f59e0b", border: "#d97706" },
  high: { bg: "#f43f5e", border: "#e11d48" },
  urgent: { bg: "#dc2626", border: "#b91c1c" },
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: TaskWithRelations;
  priority: string;
}

interface CalendarViewProps {
  tasks: TaskWithRelations[];
  onView: (task: TaskWithRelations) => void;
}

function CustomToolbar({
  label,
  view,
  onNavigate,
  onView,
}: ToolbarProps<CalendarEvent, object>) {
  const VIEWS: { id: View; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("TODAY")}
          className="h-8 px-3 text-xs font-medium"
        >
          Today
        </Button>
        <div className="flex items-center rounded-lg border bg-background p-0.5 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("PREV")}
            className="size-7 rounded-md"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("NEXT")}
            className="size-7 rounded-md"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h3 className="ml-2 text-sm font-semibold tracking-tight">{label}</h3>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onView(v.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              view === v.id
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CalendarView({ tasks, onView }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const events: CalendarEvent[] = useMemo(
    () =>
      tasks
        .filter((t) => !!t.t.deadline)
        .map((task) => {
          const deadline = new Date(task.t.deadline!);
          return {
            id: task.t.id,
            title: task.t.title,
            start: deadline,
            end: deadline,
            resource: task,
            priority: task.t.priority,
          };
        }),
    [tasks]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors = PRIORITY_COLORS[event.priority] ?? PRIORITY_COLORS.medium;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: "6px",
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: 500,
        padding: "2px 6px",
        border: "none",
        opacity: 0.95,
      },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="calendar-container rounded-xl border overflow-hidden bg-card"
    >
      <style>{`
        .rbc-calendar {
          background: transparent;
          font-family: inherit;
          min-height: 600px;
        }
        .rbc-header {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          padding: 10px 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.25);
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: none;
        }
        .rbc-day-bg {
          transition: background 0.1s;
        }
        .rbc-day-bg:hover {
          background: hsl(var(--muted) / 0.35);
        }
        .rbc-today {
          background: hsl(var(--foreground) / 0.04) !important;
        }
        .rbc-off-range-bg {
          background: hsl(var(--muted) / 0.15);
        }
        .rbc-date-cell {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          padding: 6px 8px;
        }
        .rbc-date-cell.rbc-now {
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-row-bg {
          border-right: 1px solid hsl(var(--border));
        }
        .rbc-show-more {
          font-size: 10px;
          color: hsl(var(--foreground) / 0.7);
          background: hsl(var(--muted) / 0.5);
          border-radius: 4px;
          padding: 2px 6px;
          margin-top: 2px;
          display: inline-block;
        }
        .rbc-event {
          cursor: pointer;
          transition: transform 0.15s;
        }
        .rbc-event:hover {
          transform: translateY(-1px);
        }
        .rbc-event:focus {
          outline: 2px solid hsl(var(--foreground) / 0.3);
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border: none;
        }
        .rbc-agenda-table td, .rbc-agenda-table th {
          font-size: 12px;
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
          padding: 10px 12px;
        }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell {
          color: hsl(var(--muted-foreground));
        }
        .rbc-time-header-content, .rbc-time-content {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        .rbc-time-slot {
          font-size: 10px;
          color: hsl(var(--muted-foreground));
        }
      `}</style>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 border-b text-[11px] text-muted-foreground bg-muted/15">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <span>Deadline Calendar</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground">Priority:</span>
          {[
            { label: "Low", color: "#6366f1" },
            { label: "Medium", color: "#f59e0b" },
            { label: "High", color: "#f43f5e" },
            { label: "Urgent", color: "#dc2626" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="size-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        view={currentView}
        onView={(newView) => setCurrentView(newView)}
        views={["month", "week", "day", "agenda"]}
        style={{ height: 640 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event: CalendarEvent) => onView(event.resource)}
        components={{
          toolbar: CustomToolbar,
        }}
        popup
        tooltipAccessor={(event: CalendarEvent) =>
          `${event.resource.t.title} — ${
            event.resource.assignee
              ? `${event.resource.assignee.firstName} ${event.resource.assignee.lastName}`
              : "Unassigned"
          }`
        }
      />
    </motion.div>
  );
}
