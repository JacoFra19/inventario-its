

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-3xl bg-white p-5 shadow ring-1 ring-gray-100 md:p-6 ${className}`}
    >
      {(title || description || actions) && (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            {title && (
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
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
      )}

      {children}
    </section>
  );
}