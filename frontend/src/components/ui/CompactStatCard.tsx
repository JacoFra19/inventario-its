interface CompactStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "danger" | "success" | "warning" | "info";
}

function hoverClass(variant: CompactStatCardProps["variant"]) {
  if (variant === "danger") return "hover:bg-red-50";
  if (variant === "success") return "hover:bg-emerald-50";
  if (variant === "warning") return "hover:bg-orange-50";
  if (variant === "info") return "hover:bg-blue-50";

  return "hover:bg-gray-50";
}

function accentClass(variant: CompactStatCardProps["variant"]) {
  if (variant === "danger") return "bg-red-500";
  if (variant === "success") return "bg-emerald-500";
  if (variant === "warning") return "bg-orange-500";
  if (variant === "info") return "bg-blue-500";

  return "bg-gray-300";
}

function content({ title, value, description, variant }: CompactStatCardProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accentClass(variant)}`} />
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </p>
      </div>

      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold leading-none text-gray-950">{value}</p>
        {description && (
          <p className="truncate text-xs font-medium text-gray-400">
            {description}
          </p>
        )}
      </div>
    </>
  );
}

export default function CompactStatCard(props: CompactStatCardProps) {
  const baseClass = [
    "rounded-2xl border bg-white p-3.5 text-left shadow-sm ring-1 transition",
    props.active
      ? "border-gray-900 ring-gray-900/10"
      : "border-gray-100 ring-gray-100",
    props.onClick ? `hover:-translate-y-0.5 hover:shadow-md ${hoverClass(props.variant)}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className={baseClass}>
        {content(props)}
      </button>
    );
  }

  return <div className={baseClass}>{content(props)}</div>;
}
