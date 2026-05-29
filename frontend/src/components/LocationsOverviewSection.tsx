"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardLocation } from "@/lib/api";
import SectionCard from "@/components/ui/SectionCard";
import SecondaryButton from "@/components/ui/SecondaryButton";
import StatusBadge from "@/components/StatusBadge";

type LocationsOverviewSectionProps = {
  locations: DashboardLocation[];
};

function cardClass(location: DashboardLocation) {
  if (location.alert_level === "critical") {
    return "border-red-100 bg-red-50/70 hover:bg-red-50";
  }

  if (location.alert_level === "warning") {
    return "border-orange-100 bg-orange-50/70 hover:bg-orange-50";
  }

  return "border-gray-100 bg-white hover:bg-blue-50";
}

function alertBadge(location: DashboardLocation) {
  if (location.alert_level === "critical") {
    return <StatusBadge status="MANCANTE" label={`${location.alert_count} criticità`} size="sm" />;
  }

  if (location.alert_level === "warning") {
    return <StatusBadge status="WARNING" label={`${location.alert_count} warning`} size="sm" />;
  }

  return <StatusBadge status="IN_SEDE" label="Regolare" size="sm" />;
}

export default function LocationsOverviewSection({
  locations,
}: LocationsOverviewSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const canToggle = locations.length > 6;
  const visibleLocations = expanded ? locations : locations.slice(0, 6);

  return (
    <SectionCard
      className="mb-8"
      title="Panoramica Sedi"
      description="Mini mappa operativa delle sedi ITS, con asset, stock e criticità."
      actions={
        canToggle ? (
          <SecondaryButton
            onClick={() => setExpanded((current) => !current)}
            className="px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
          >
            {expanded ? "Mostra meno ↑" : "Mostra tutte ↓"}
          </SecondaryButton>
        ) : undefined
      }
    >
      {locations.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-medium text-gray-600">
          Nessuna sede disponibile.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleLocations.map((location) => (
            <article
              key={location.location_id}
              className={`rounded-3xl border p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md ${cardClass(location)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {location.code}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-gray-950">
                    {location.name}
                  </h3>
                </div>

                {alertBadge(location)}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-gray-100">
                  <p className="text-gray-500">Asset totali</p>
                  <p className="mt-1 text-2xl font-bold">{location.asset_total}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-gray-100">
                  <p className="text-gray-500">Stock disp.</p>
                  <p className="mt-1 text-2xl font-bold">{location.stock_quantity_total}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-gray-100">
                  <p className="text-gray-500">Assegnati</p>
                  <p className="mt-1 text-xl font-bold">{location.asset_assigned}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 ring-1 ring-gray-100">
                  <p className="text-gray-500">In evento</p>
                  <p className="mt-1 text-xl font-bold">{location.asset_in_event}</p>
                </div>
              </div>

              {(location.asset_missing > 0 || location.low_stock_count > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {location.asset_missing > 0 && (
                    <StatusBadge status="MANCANTE" label={`${location.asset_missing} mancanti`} size="sm" />
                  )}
                  {location.low_stock_count > 0 && (
                    <StatusBadge status="WARNING" label={`${location.low_stock_count} stock sotto soglia`} size="sm" />
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/assets?locationId=${location.location_id}`}
                  className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Asset
                </Link>
                <Link
                  href={`/stocks?locationId=${location.location_id}`}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-100 transition hover:bg-gray-50"
                >
                  Stock
                </Link>
                <Link
                  href="/events"
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-100 transition hover:bg-gray-50"
                >
                  Eventi
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
