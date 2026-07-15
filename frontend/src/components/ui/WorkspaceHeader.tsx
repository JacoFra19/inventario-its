interface WorkspaceHeaderProps {
  title?: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export default function WorkspaceHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
}: WorkspaceHeaderProps) {
  return (
    <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {(title || description) && (
        <div className="min-w-0">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              {title}
            </h1>
          )}

          {description && (
            <p className={title ? "mt-1 max-w-2xl text-sm text-gray-600" : "max-w-2xl text-sm text-gray-600"}>
              {description}
            </p>
          )}
        </div>
      )}

      {(primaryAction || secondaryActions) && (
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:flex-wrap lg:ml-auto lg:justify-end">
          {primaryAction}
          {secondaryActions}
        </div>
      )}
    </header>
  );
}
