import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Course } from "../domain/models";
import { useAppServices } from "../state/AppServicesProvider";

interface SubjectCourseGroup {
  subjectId: string;
  subjectTitle: string;
  courses: Course[];
}

function getSubjectIcon(subjectId: string) {
  if (subjectId === "science") {
    return "🧪";
  }

  if (subjectId === "spanish") {
    return "💬";
  }

  return "📘";
}

export function CoursesPage() {
  const { contentRepository } = useAppServices();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    contentRepository.listCourses().then(setCourses);
  }, [contentRepository]);

  const subjectGroups = Object.values(
    courses.reduce<Record<string, SubjectCourseGroup>>((groups, course) => {
      const group = groups[course.subjectId] ?? {
        subjectId: course.subjectId,
        subjectTitle: course.subjectTitle,
        courses: [],
      };
      group.courses.push(course);
      groups[course.subjectId] = group;
      return groups;
    }, {}),
  ).sort((left, right) => {
    if (left.subjectId === "math") {
      return -1;
    }
    if (right.subjectId === "math") {
      return 1;
    }
    return left.subjectTitle.localeCompare(right.subjectTitle);
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Courses</p>
        <h2 className="text-2xl font-semibold text-ink">Choose what to study</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Start with a subject, then choose the course that matches your current
          learning path.
        </p>
      </div>

      {subjectGroups.map((group) => {
        const subjectIcon = getSubjectIcon(group.subjectId);
        const sortedCourses = [...group.courses].sort(
          (left, right) => left.order - right.order || left.title.localeCompare(right.title),
        );

        return (
          <section className="panel panel-padding" key={group.subjectId}>
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <div className="text-3xl" aria-hidden="true">
                {subjectIcon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">{group.subjectTitle}</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {sortedCourses.length} course{sortedCourses.length === 1 ? "" : "s"} available
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {sortedCourses.map((course) => {
                const concepts = course.units.flatMap((unit) => unit.concepts);
                const readyConcepts = concepts.filter((concept) => concept.hasTest).length;

                return (
                  <article
                    className="flex h-full flex-col justify-between rounded-2xl border border-stone-200 bg-white px-5 py-5"
                    key={course.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h4 className="text-lg font-semibold text-ink">{course.title}</h4>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Available
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-600">
                        {course.description}
                      </p>
                      <p className="mt-3 text-sm text-stone-500">
                        {course.units.length} unit{course.units.length === 1 ? "" : "s"} ·{" "}
                        {readyConcepts} practice-ready concept
                        {readyConcepts === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="mt-5">
                      <Link className="action-link" to={`/course/${course.id}`}>
                        Open {course.title}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
