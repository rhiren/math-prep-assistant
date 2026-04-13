import type { ScoreSummary as ScoreSummaryModel } from "../domain/models";

export function ScoreSummary({ summary }: { summary: ScoreSummaryModel }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <SummaryCard label="Score" value={`${summary.percentage}%`} />
      <SummaryCard label="Total" value={String(summary.totalQuestions)} />
      <SummaryCard label="Correct" value={String(summary.correctCount)} />
      <SummaryCard label="Incorrect" value={String(summary.incorrectCount)} />
      <SummaryCard label="Unanswered" value={String(summary.unansweredCount)} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
