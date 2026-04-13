import { Link } from "react-router-dom";
import type { Concept, ProgressRecord } from "../domain/models";
import { MasteryBadge } from "./MasteryBadge";

interface ConceptCardProps {
  concept: Concept;
  progress?: ProgressRecord | null;
}

export function ConceptCard({ concept, progress }: ConceptCardProps) {
  const status = progress?.masteryStatus ?? concept.masteryStatus;
  const practiceState = concept.hasTest ? "Practice ready" : "Coming soon";

  return (
    <article className="panel panel-padding flex h-full flex-col justify-between gap-4">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{concept.title}</h3>
          <MasteryBadge status={status} />
        </div>
        <p className="text-sm leading-6 text-stone-600">{concept.description}</p>
        <p className="mt-3 text-sm text-stone-500">{practiceState}</p>
      </div>
      <div className="flex items-center justify-between text-sm text-stone-600">
        <div>
          <div>{progress?.attemptCount ?? 0} attempt(s)</div>
          <div>Best: {progress?.bestScore ?? "—"}%</div>
        </div>
        <Link className="action-link" to={`/concept/${concept.id}`}>
          Open concept
        </Link>
      </div>
    </article>
  );
}
