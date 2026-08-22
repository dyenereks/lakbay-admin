import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page isn't a link. */
  href?: string;
}

/**
 * Breadcrumb trail for admin section pages, giving a way back up to the
 * dashboard now that the header carries no section links.
 */
export default function AdminBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className="flex items-center gap-1.5 flex-wrap text-[13px]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-font-secondary hover:text-primary-teal transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-font-primary font-semibold">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight size={14} className="text-font-muted" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
