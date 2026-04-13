import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Concept } from "../domain/models";
import { useAppServices } from "../state/AppServicesProvider";

export function ConceptTutorialPage() {
  const { conceptId } = useParams();
  const { contentRepository } = useAppServices();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [tutorialContent, setTutorialContent] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId) {
      return;
    }

    contentRepository.getConcept(conceptId).then(setConcept);
    contentRepository.getTutorialContent(conceptId).then(setTutorialContent);
  }, [conceptId, contentRepository]);

  if (!concept) {
    return <div className="panel panel-padding">Concept not found.</div>;
  }

  if (!tutorialContent) {
    return <div className="panel panel-padding">Tutorial not available yet.</div>;
  }

  const sections = tutorialContent
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <section className="space-y-6">
      <div>
        <Link className="text-sm font-medium text-accent" to={`/concept/${concept.id}`}>
          Back to concept
        </Link>
        <h2 className="mt-2 text-3xl font-semibold text-ink">{concept.title} Tutorial</h2>
        <p className="mt-2 text-sm text-stone-600">
          Read through the idea first, then return for practice when it is available.
        </p>
      </div>

      <article className="panel panel-padding space-y-4">
        {sections.map((section, index) =>
          section.startsWith("# ") ? (
            <h3 key={index} className="text-2xl font-semibold text-ink">
              {section.replace(/^# /, "")}
            </h3>
          ) : section.startsWith("- ") ? (
            <ul key={index} className="space-y-2 text-sm leading-7 text-stone-700">
              {section.split("\n").map((item) => (
                <li key={item} className="ml-5 list-disc">
                  {item.replace(/^- /, "")}
                </li>
              ))}
            </ul>
          ) : section.match(/^\d+\./m) ? (
            <div key={index} className="space-y-2 text-sm leading-7 text-stone-700">
              {section.split("\n").map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <p key={index} className="text-sm leading-7 text-stone-700">
              {section}
            </p>
          ),
        )}
      </article>
    </section>
  );
}
