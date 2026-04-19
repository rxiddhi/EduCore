import { useSearchParams } from 'react-router-dom';
import { PortalLayout } from '../layouts/PortalLayout';

export function TeacherSettingsPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';

  return (
    <PortalLayout role="TEACHER" title="Settings">
      <section className="mb-6">
        <h2 className="text-3xl font-black tracking-tight">Teacher Settings</h2>
        <p className="text-[var(--on-surface-variant)]">Current tab: {tab}</p>
      </section>

      <div className="ec-card p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="ec-input" placeholder="Display Name" defaultValue="Dr. Elena Thorne" />
          <input className="ec-input" placeholder="Department" defaultValue="Humanities" />
          <input className="ec-input" placeholder="Work Email" defaultValue="elena.thorne@educore.edu" />
          <input className="ec-input" placeholder="Office Hours" defaultValue="Tue/Thu 2-4 PM" />
        </div>
        <button className="ec-primary-btn mt-4" type="button">
          Save Settings
        </button>
      </div>
    </PortalLayout>
  );
}
