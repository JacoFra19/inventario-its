"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardActivity } from "@/lib/api";
import SectionCard from "@/components/ui/SectionCard";
import SecondaryButton from "@/components/ui/SecondaryButton";

type RecentActivitiesSectionProps = {
  activities: DashboardActivity[];
};

function activityBadgeClass(severity: string) {
  if (severity === "critical") {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (severity === "warning") {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (severity === "success") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  return "border-blue-200 bg-blue-100 text-blue-700";
}

function activityIcon(category: string) {
  if (category === "asset") return "AS";
  if (category === "stock") return "ST";
  if (category === "event") return "EV";

  return "OP";
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function RecentActivitiesSection({
  activities,
}: RecentActivitiesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const canToggle = activities.length > 3;
  const visibleActivities = expanded ? activities : activities.slice(0, 3);

  return (
    <SectionCard
      className="mb-8"
      title="Attività recenti"
      description="Ultime operazioni registrate su asset, stock ed eventi."
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
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-medium text-gray-600">
          Nessuna attività recente registrata.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleActivities.map((activity, index) => {
            const href =
              typeof activity.references.href === "string"
                ? activity.references.href
                : null;

            const content = (
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-xs font-bold text-white">
                    {activityIcon(activity.category)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-950">
                        {activity.title}
                      </h3>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${activityBadgeClass(activity.severity)}`}>
                        {activity.category}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-sm text-gray-500">
                  {formatActivityDate(activity.timestamp)}
                </p>
              </div>
            );

            if (href) {
              return (
                <Link key={`${activity.type}-${activity.timestamp}-${index}`} href={href}>
                  {content}
                </Link>
              );
            }

            return (
              <div key={`${activity.type}-${activity.timestamp}-${index}`}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
