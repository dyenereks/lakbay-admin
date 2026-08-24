/**
 * Skeleton for the package list, mirroring its row layout so the swap to real
 * content doesn't jump. Also covers /packages/new and /packages/[slug], which
 * are forms rather than lists — acceptable, since both are brief and the header
 * and breadcrumb line up either way.
 */
export default function Loading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 flex flex-col gap-6 animate-pulse">
      <div className="h-3 w-44 rounded bg-border-light" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 rounded bg-border-light" />
          <div className="h-3 w-64 rounded bg-border-light" />
        </div>
        <div className="h-10 w-36 rounded-full bg-border-light" />
      </div>

      <ul className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li
            key={i}
            className="bg-white rounded-[12px] flex items-center gap-4 p-3"
          >
            <div className="w-[88px] h-[64px] rounded-[8px] bg-bg-light shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="h-4 w-1/3 rounded bg-border-light" />
              <div className="h-3 w-1/4 rounded bg-border-light" />
              <div className="h-3 w-20 rounded bg-border-light" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-24 rounded-full bg-bg-light" />
              <div className="h-9 w-20 rounded-full bg-bg-light" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
