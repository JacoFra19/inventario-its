"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Asset,
  Item,
  Location,
  createAsset,
  getAssets,
  getItems,
  getLocations,
} from "@/lib/api";

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [itemId, setItemId] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");

  useEffect(() => {
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  async function loadData() {
    const [assetsData, itemsData, locationsData] = await Promise.all([
      getAssets(),
      getItems(),
      getLocations(),
    ]);

    setAssets(assetsData);
    setItems(itemsData);
    setLocations(locationsData);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || !locationCode) return;

    setLoading(true);

    try {
      await createAsset({
        itemId: Number(itemId),
        locationCode,
        notes,
      });

      setItemId("");
      setLocationCode("");
      setNotes("");
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  function locationLabel(id: number) {
    const location = locations.find((l) => l.id === id);
    return location ? `${location.code} - ${location.name}` : id;
  }

  function statusBadgeClass(status: string) {
    if (status === "IN_SEDE") return "bg-emerald-100 text-emerald-700";
    if (status === "ASSEGNATO") return "bg-blue-100 text-blue-700";
    if (status === "IN_EVENTO") return "bg-orange-100 text-orange-700";
    if (status === "MANCANTE") return "bg-red-100 text-red-700";

    return "bg-gray-100 text-gray-700";
  }

  function itemCategoryLabel(item: Item) {
    return item.category?.name ?? "Categoria non impostata";
  }

  const totalAssets = assets.length;
  const inSedeCount = assets.filter((a) => a.status === "IN_SEDE").length;
  const assegnatiCount = assets.filter((a) => a.status === "ASSEGNATO").length;
  const inEventoCount = assets.filter((a) => a.status === "IN_EVENTO").length;
  const mancantiCount = assets.filter((a) => a.status === "MANCANTE").length;

  const filteredAssets = assets.filter((asset) => {
    const matchesStatus =
      statusFilter === "ALL" || asset.status === statusFilter;

    const matchesLocation =
      locationFilter === "ALL" ||
      asset.current_location_id === Number(locationFilter);

    const text = [
      asset.inventory_code,
      asset.status,
      asset.assigned_to ?? "",
      asset.notes ?? "",
      locationLabel(asset.current_location_id),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    return matchesStatus && matchesLocation && matchesSearch;
  });

  const uniqueStatuses = Array.from(new Set(assets.map((asset) => asset.status)));

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="/" className="text-blue-600 hover:underline">
            ← Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">Asset</h1>
          <p className="text-gray-600">
            Gestione beni inventariati, codici univoci e QR.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="/items"
            className="rounded-xl border px-5 py-3 text-center font-semibold hover:bg-white"
          >
            Catalogo Item
          </a>

          <a
            href="/scan"
            className="rounded-xl bg-gray-900 px-5 py-3 text-center font-semibold text-white shadow hover:bg-black"
          >
            Apri Scanner QR
          </a>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Asset totali</p>
          <p className="mt-2 text-3xl font-bold">{totalAssets}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("IN_SEDE");
            window.history.replaceState(null, "", "/assets?status=IN_SEDE");
          }}
          className="rounded-2xl bg-white p-5 text-left shadow transition hover:bg-emerald-50"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">In sede</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass("IN_SEDE")}`}>
              IN_SEDE
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{inSedeCount}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("ASSEGNATO");
            window.history.replaceState(null, "", "/assets?status=ASSEGNATO");
          }}
          className="rounded-2xl bg-white p-5 text-left shadow transition hover:bg-blue-50"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">Assegnati</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass("ASSEGNATO")}`}>
              ASSEGNATO
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{assegnatiCount}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("IN_EVENTO");
            window.history.replaceState(null, "", "/assets?status=IN_EVENTO");
          }}
          className="rounded-2xl bg-white p-5 text-left shadow transition hover:bg-orange-50"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">In evento</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass("IN_EVENTO")}`}>
              IN_EVENTO
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{inEventoCount}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("MANCANTE");
            window.history.replaceState(null, "", "/assets?status=MANCANTE");
          }}
          className="rounded-2xl bg-white p-5 text-left shadow transition hover:bg-red-50"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">Mancanti</p>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass("MANCANTE")}`}>
              MANCANTE
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{mancantiCount}</p>
        </button>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Nuovo asset</h2>
        <p className="mb-4 text-sm text-gray-500">
          Crea un bene fisico partendo da una tipologia già presente nel catalogo item.
        </p>

        <form onSubmit={handleCreateAsset} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select
            className="rounded-xl border p-3"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Seleziona item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.brand ? `- ${item.brand}` : ""} {item.model ? ` ${item.model}` : ""} ({itemCategoryLabel(item)})
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border p-3"
            value={locationCode}
            onChange={(e) => setLocationCode(e.target.value)}
          >
            <option value="">Seleziona sede</option>
            {locations.map((location) => (
              <option key={location.id} value={location.code}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>

          <input
            className="rounded-xl border p-3"
            placeholder="Note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creo..." : "Crea asset"}
          </button>
        </form>
      </section>

      <section className="mb-4 rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Filtri asset</h2>
            <p className="text-sm text-gray-500">
              Cerca e filtra per stato, sede, assegnazione o note.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setLocationFilter("ALL");
              window.history.replaceState(null, "", "/assets");
            }}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Pulisci filtri
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Ricerca
            </label>
            <input
              className="w-full rounded-xl border p-3 shadow-sm"
              placeholder="Codice, sede, stato, assegnatario o note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Stato
            </label>
            <select
              className="w-full rounded-xl border p-3 shadow-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                window.history.replaceState(
                  null,
                  "",
                  e.target.value === "ALL" ? "/assets" : `/assets?status=${e.target.value}`
                );
              }}
            >
              <option value="ALL">Tutti gli stati</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Sede
            </label>
            <select
              className="w-full rounded-xl border p-3 shadow-sm"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="ALL">Tutte le sedi</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {filteredAssets.length} asset trovati su {assets.length}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Codice</th>
              <th className="p-4 text-left">Sede</th>
              <th className="p-4 text-left">Stato</th>
              <th className="p-4 text-left">Assegnato a</th>
              <th className="p-4 text-left">Note</th>
            </tr>
          </thead>

          <tbody>
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Nessun asset trovato con i filtri selezionati.
                </td>
              </tr>
            )}
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{asset.id}</td>
                <td className="p-4 font-mono">
                  <a
                    href={`/assets/${asset.inventory_code}`}
                    className="text-blue-600 hover:underline"
                  >
                    {asset.inventory_code}
                  </a>
                </td>
                <td className="p-4">{locationLabel(asset.current_location_id)}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(asset.status)}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="p-4">{asset.assigned_to ?? "-"}</td>
                <td className="p-4">{asset.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}