/**
 * Instant fallback for admin navigations. Every route in this group is
 * force-dynamic and reads Firestore, so a click otherwise sits on the old page
 * for a moment with no feedback.
 *
 * Covers any segment without its own loading.tsx — currently the dashboard.
 */
export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 animate-pulse">
      <div className="h-3 w-40 rounded bg-border-light" />

      <div className="flex flex-col gap-2">
        <div className="h-7 w-52 rounded bg-border-light" />
        <div className="h-3 w-72 rounded bg-border-light" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-[14px] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-bg-light" />
              <div className="h-6 w-20 rounded-full bg-bg-light" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 rounded bg-border-light" />
              <div className="h-3 w-full rounded bg-border-light" />
              <div className="h-3 w-2/3 rounded bg-border-light" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
