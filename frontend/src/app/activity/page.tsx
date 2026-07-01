"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getActivity, type DashboardActivity } from "@/lib/api";
import ActivityCategoryIcon from "@/components/ActivityCategoryIcon";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import SecondaryButton from "@/components/ui/SecondaryButton";

const PAGE_SIZE = 50;

const categoryOptions = [
  { value: "", label: "Tutte" },
  { value: "asset", label: "Asset" },
  { value: "stock", label: "Stock" },
  { value: "event", label: "Eventi" },
  { value: "import", label: "Import" },
  { value: "assignee", label: "Assegnazioni" },
  { value: "transfer", label: "Trasferimenti" },
  { value: "system", label: "Sistema" },
];

const severityOptions = [
  { value: "", label: "Tutte" },
  { value: "info", label: "Info" },
  { value: "success", label: "Successo" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critico" },
];

function categoryLabel(category: string) {
  return categoryOptions.find((option) => option.value === category)?.label ?? category;
}

function severityClass(severity: string) {
  if (severity === "critical") return "border-red-200 bg-red-100 text-red-700";
  if (severity === "warning") return "border-orange-200 bg-orange-100 text-orange-700";
  if (severity === "success") return "border-emerald-200 bg-emerald-100 text-emerald-700";

  return "border-blue-200 bg-blue-100 text-blue-700";
}

function severityLabel(severity: string) {
  return severityOptions.find((option) => option.value === severity)?.label ?? severity;
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatActivityDay(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedActivities = useMemo(() => {
    return activities.reduce<Array<{ key: string; label: string; items: DashboardActivity[] }>>(
      (groups, activity) => {
        const key = dayKey(activity.timestamp);
        const currentGroup = groups.find((group) => group.key === key);

        if (currentGroup) {
          currentGroup.items.push(activity);
        } else {
          groups.push({
            key,
            label: formatActivityDay(activity.timestamp),
            items: [activity],
          });
        }

        return groups;
      },
      []
    );
  }, [activities]);

  const loadActivities = useCallback(
    async (nextOffset: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await getActivity({
          q: query.trim() || undefined,
          category: category || undefined,
          severity: severity || undefined,
          limit: PAGE_SIZE,
          offset: nextOffset,
        });

        setActivities((current) =>
          append ? [...current, ...response.items] : response.items
        );
        setTotal(response.total);
        setHasMore(response.has_more);
      } catch (err) {
        console.error(err);
        setError("Errore durante il recupero del registro attività.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, query, severity]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadActivities(0);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadActivities]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <PageHeader
        eyebrow="Diario operativo"
        title="Registro Attività"
        description="Storico consultabile delle operazioni registrate su asset, stock, eventi, import e assegnazioni."
        backHref="/"
        backLabel="Dashboard"
      />

      <SectionCard
        className="mb-8"
        title="Filtri"
        description="Cerca per codice asset, item, evento, sede o descrizione attività."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Ricerca</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca attività..."
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Categoria</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {categoryOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Severità</span>
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {severityOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Storico operativo"
        description={`${total} attività trovate`}
        actions={
          <SecondaryButton
            onClick={() => {
              setQuery("");
              setCategory("");
              setSeverity("");
            }}
            className="px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
          >
            Azzera filtri
          </SecondaryButton>
        }
      >
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-sm font-medium text-gray-600">
            Caricamento registro attività...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-sm font-medium text-gray-600">
            Nessuna attività trovata con i filtri selezionati.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActivities.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
                  {group.label}
                </h2>

                <div className="space-y-3">
                  {group.items.map((activity) => {
                    const href =
                      typeof activity.href === "string"
                        ? activity.href
                        : typeof activity.references.href === "string"
                          ? activity.references.href
                          : null;

                    const content = (
                      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md md:flex-row md:items-start md:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-xs font-bold text-white">
                            <ActivityCategoryIcon category={activity.category} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-950">
                                {activity.title}
                              </h3>
                              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {categoryLabel(activity.category)}
                              </span>
                              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(activity.severity)}`}>
                                {severityLabel(activity.severity)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-600">
                              {activity.description}
                            </p>

                            <p className="mt-2 text-xs font-medium text-gray-400">
                              {activity.type}
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
                        <Link key={activity.id} href={href}>
                          {content}
                        </Link>
                      );
                    }

                    return <div key={activity.id}>{content}</div>;
                  })}
                </div>
              </section>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <SecondaryButton
                  onClick={() => void loadActivities(activities.length, true)}
                  disabled={loadingMore}
                  className="px-5 py-3 text-sm text-blue-700 hover:bg-blue-50"
                >
                  {loadingMore ? "Caricamento..." : "Carica altro"}
                </SecondaryButton>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </main>
  );
}
