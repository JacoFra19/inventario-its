"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type GlobalSearchResponse,
  type GlobalSearchResult,
  searchGlobal,
} from "@/lib/api";
import SectionCard from "@/components/ui/SectionCard";

const resultGroups: Array<{
  key: keyof GlobalSearchResponse["results"];
  label: string;
}> = [
  { key: "assets", label: "Asset" },
  { key: "items", label: "Item" },
  { key: "stocks", label: "Stock" },
  { key: "events", label: "Eventi" },
];

function resultBadge(type: GlobalSearchResult["type"]) {
  if (type === "asset") return "AS";
  if (type === "item") return "IT";
  if (type === "stock") return "ST";
  return "EV";
}

function totalResults(results: GlobalSearchResponse["results"] | null) {
  if (!results) return 0;

  return resultGroups.reduce((total, group) => total + results[group.key].length, 0);
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setResponse(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const result = await searchGlobal(trimmedQuery, controller.signal);
        if (!controller.signal.aborted) {
          setResponse(result);
        }
      } catch (searchError) {
        if (!controller.signal.aborted) {
          console.error(searchError);
          setResponse(null);
          setError("Errore durante la ricerca.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [canSearch, trimmedQuery]);

  const hasResults = useMemo(() => totalResults(response?.results ?? null) > 0, [response]);

  return (
    <SectionCard
      className="mb-8"
      title="Ricerca globale"
      description="Cerca rapidamente asset, item, stock ed eventi."
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cerca notebook, codice asset, evento o sede..."
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-0 transition placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
      />

      <div className="mt-3 text-sm text-gray-500">
        {!canSearch && "Digita almeno 2 caratteri per iniziare la ricerca."}
        {canSearch && loading && "Ricerca in corso..."}
        {canSearch && !loading && error}
        {canSearch && !loading && !error && response && !hasResults && (
          "Nessun risultato trovato."
        )}
      </div>

      {canSearch && !loading && !error && response && hasResults && (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {resultGroups.map((group) => {
            const rows = response.results[group.key];

            if (rows.length === 0) {
              return null;
            }

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                    {group.label}
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                    {rows.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {rows.map((result, index) => (
                    <Link
                      key={`${result.type}-${result.title}-${index}`}
                      href={result.href}
                      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-bold text-white">
                        {resultBadge(result.type)}
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-gray-950">
                          {result.title}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-sm text-gray-600">
                          {result.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
