

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {backHref && backLabel && (
          <a
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-blue-50"
          >
            ← {backLabel}
          </a>
        )}

        {eyebrow && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-gray-600">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {actions}
        </div>
      )}
    </div>
  );
}