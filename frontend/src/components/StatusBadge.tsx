type StatusBadgeVariant =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral";

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function badgeVariant(status: string): StatusBadgeVariant {
  const normalized = normalizeStatus(status);

  if (
    [
      "IN_SEDE",
      "RETURNED",
      "RIENTRATO",
      "CLOSED",
      "CHIUSO",
      "DISPONIBILE",
      "ATTIVO",
      "SI",
      "TRUE",
    ].includes(normalized)
  ) {
    return "success";
  }

  if (
    [
      "ASSEGNATO",
      "OPEN",
      "APERTO",
      "INFO",
    ].includes(normalized)
  ) {
    return "info";
  }

  if (
    [
      "IN_EVENTO",
      "OUT",
      "WARNING",
      "LOW",
      "SOTTO_SOGLIA",
    ].includes(normalized)
  ) {
    return "warning";
  }

  if (
    [
      "MANCANTE",
      "MISSING",
      "ERROR",
      "NO",
      "FALSE",
      "ANNULLATO",
      "CANCELLED",
    ].includes(normalized)
  ) {
    return "danger";
  }

  return "neutral";
}

function variantClass(variant: StatusBadgeVariant) {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (variant === "info") {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (variant === "warning") {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (variant === "danger") {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function normalizedLabel(status: string) {
  const normalized = normalizeStatus(status);

  const labels: Record<string, string> = {
    OPEN: "Aperto",
    CLOSED: "Chiuso",
    CANCELLED: "Annullato",
    RETURNED: "Rientrato",
    MISSING: "Mancante",
    OUT: "In uscita",
    LOW: "Sotto soglia",
    TRUE: "Sì",
    FALSE: "No",
  };

  return labels[normalized] ?? status;
}

export default function StatusBadge({
  status,
  label,
  size = "md",
}: StatusBadgeProps) {
  const variant = badgeVariant(status);

  return (
    <span
      className={`inline-flex rounded-full border font-semibold ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1 text-sm"
      } ${variantClass(variant)}`}
    >
      {label ?? normalizedLabel(status)}
    </span>
  );
}