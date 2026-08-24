/**
 * Skeleton for the contact settings form: action bar plus the three section
 * cards (Facebook page, phone numbers, office address).
 */
export default function Loading() {
  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-4 pb-8 flex flex-col gap-5 animate-pulse">
      <div className="h-3 w-48 rounded bg-border-light" />

      <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-border-light">
        <div className="h-7 w-48 rounded bg-border-light" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-16 rounded bg-border-light" />
          <div className="h-10 w-32 rounded-full bg-border-light" />
        </div>
      </div>

      {[
        { rows: 1 },
        { rows: 3 },
        { rows: 2 },
      ].map((section, i) => (
        <section key={i} className="bg-white rounded-[12px] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 rounded bg-border-light" />
            <div className="h-3 w-3/4 rounded bg-border-light" />
          </div>
          {Array.from({ length: section.rows }).map((_, row) => (
            <div key={row} className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-border-light" />
              <div className="h-10 w-full rounded-[8px] bg-bg-light" />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
