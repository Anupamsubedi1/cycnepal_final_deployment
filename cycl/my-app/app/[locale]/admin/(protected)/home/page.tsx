export default function AdminHomePage() {
  return (
    <main className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
      <section className="border border-[#d6e6ed] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-deep/80">
          Admin Dashboard
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[#123451]">
          Homepage content lives in the sidebar
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          The sidebar now contains the main management links for homepage sections, so editors can jump straight to the content they want to update.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="border border-[#d6e6ed] bg-[#f9fcfe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-deep/70">Quick access</p>
            <p className="mt-2 text-sm text-slate-700">Use the sidebar links for hero, notices, stats, and other homepage modules.</p>
          </div>
          <div className="border border-[#d6e6ed] bg-[#f9fcfe] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-deep/70">Vacancy tools</p>
            <p className="mt-2 text-sm text-slate-700">Vacancy management remains available from the same sidebar navigation.</p>
          </div>
        </div>
      </section>

      <aside className="border border-[#0d837f] bg-teal-mid p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Current setup</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-white/90">
          <li>Sidebar navigation for homepage sections and vacancies</li>
          <li>Protected admin shell shared across all admin pages</li>
          <li>Scrollable sidebar for content-heavy management sections</li>
        </ul>
      </aside>
    </main>
  );
}
