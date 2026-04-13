import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Course } from "../domain/models";
import { useAppServices } from "../state/AppServicesProvider";

export function CoursesPage() {
  const { contentRepository } = useAppServices();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    contentRepository.listCourses().then(setCourses);
  }, [contentRepository]);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Courses
        </p>
        <h2 className="text-2xl font-semibold text-ink">Select a course</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="panel panel-padding">
            <h3 className="text-xl font-semibold text-ink">{course.title}</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">{course.description}</p>
            <p className="mt-4 text-sm text-stone-500">
              {course.units.length} unit(s) and{" "}
              {course.units.flatMap((unit) => unit.concepts).length} concept(s)
            </p>
            <div className="mt-5">
              <Link className="action-link" to={`/course/${course.id}`}>
                Open course
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
