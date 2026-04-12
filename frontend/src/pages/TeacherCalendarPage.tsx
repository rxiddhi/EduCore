import { PortalLayout } from '../layouts/PortalLayout';

const events = [
  { date: 'Apr 28, 2026', title: 'Midterm grading deadline' },
  { date: 'May 02, 2026', title: 'Attendance audit submission' },
  { date: 'May 14, 2026', title: 'Final grade lock' }
];

export function TeacherCalendarPage() {
  return (
    <PortalLayout role="TEACHER" title="Academic Calendar">
      <section className="mb-6">
        <h2 className="text-3xl font-black tracking-tight">Academic Calendar</h2>
        <p className="text-[var(--on-surface-variant)]">Important upcoming milestones.</p>
      </section>

      <div className="grid gap-3">
        {events.map((event) => (
          <article key={event.title} className="ec-card p-5">
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-700">{event.date}</p>
            <h3 className="mt-1 text-xl font-bold">{event.title}</h3>
          </article>
        ))}
      </div>
    </PortalLayout>
  );
}
