


interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger" | "success" | "warning" | "info";
}

function hoverClass(variant: StatCardProps["variant"]) {
  if (variant === "danger") return "hover:bg-red-50";
  if (variant === "success") return "hover:bg-emerald-50";
  if (variant === "warning") return "hover:bg-orange-50";
  if (variant === "info") return "hover:bg-blue-50";

  return "hover:bg-white";
}

function content({ title, value, description, badge }: StatCardProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{title}</p>
        {badge}
      </div>

      <p className="mt-2 text-3xl font-bold">{value}</p>

      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </>
  );
}

export default function StatCard(props: StatCardProps) {
  const baseClass = `rounded-3xl bg-white p-5 text-left shadow ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md ${hoverClass(props.variant)}`;

  if (props.href) {
    return (
      <a href={props.href} className={baseClass}>
        {content(props)}
      </a>
    );
  }

  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className={baseClass}>
        {content(props)}
      </button>
    );
  }

  return <div className={baseClass}>{content(props)}</div>;
}