

type StatusBadgeProps = {
  status: string;
};

function badgeClass(status: string) {
  if (status === "IN_SEDE") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (status === "ASSEGNATO") {
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }

  if (status === "IN_EVENTO") {
    return "bg-orange-100 text-orange-700 border border-orange-200";
  }

  if (status === "MANCANTE") {
    return "bg-red-100 text-red-700 border border-red-200";
  }

  return "bg-gray-100 text-gray-700 border border-gray-200";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeClass(status)}`}
    >
      {status}
    </span>
  );
}