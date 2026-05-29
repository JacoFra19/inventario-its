"use client";

import dynamic from "next/dynamic";
import type { DashboardLocation } from "@/lib/api";
import SectionCard from "@/components/ui/SectionCard";
import StatusBadge from "@/components/StatusBadge";

type LocationsMapSectionProps = {
  locations: DashboardLocation[];
};

const LocationsMap = dynamic(() => import("@/components/LocationsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">
      Caricamento mappa sedi...
    </div>
  ),
});

export default function LocationsMapSection({ locations }: LocationsMapSectionProps) {
  const criticalCount = locations.filter((location) => location.alert_level === "critical").length;
  const warningCount = locations.filter((location) => location.alert_level === "warning").length;
  const mappedCount = locations.filter((location) => location.lat !== null && location.lng !== null).length;

  return (
    <SectionCard
      className="mb-8"
      title="Mappa Sedi"
      description="Visualizzazione geografica operativa delle sedi ITS in Puglia."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="INFO" label={`${mappedCount} marker`} size="sm" />
          {criticalCount > 0 && (
            <StatusBadge status="MANCANTE" label={`${criticalCount} critiche`} size="sm" />
          )}
          {warningCount > 0 && (
            <StatusBadge status="WARNING" label={`${warningCount} warning`} size="sm" />
          )}
        </div>
      }
    >
      <LocationsMap locations={locations} />
    </SectionCard>
  );
}
