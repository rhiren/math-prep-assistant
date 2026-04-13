import type { MasteryStatus } from "../domain/models";

const labelByStatus: Record<MasteryStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  practiced: "Practiced",
  needs_review: "Needs Review",
  mastered: "Mastered",
};

const classByStatus: Record<MasteryStatus, string> = {
  not_started: "bg-stone-100 text-stone-600",
  in_progress: "bg-sky-100 text-sky-700",
  practiced: "bg-amber-100 text-amber-700",
  needs_review: "bg-rose-100 text-rose-700",
  mastered: "bg-emerald-100 text-emerald-700",
};

export function MasteryBadge({ status }: { status: MasteryStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classByStatus[status]}`}>
      {labelByStatus[status]}
    </span>
  );
}
