"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import CompactStatCard from "@/components/ui/CompactStatCard";
import DataTable from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import WorkspaceHeader from "@/components/ui/WorkspaceHeader";
import { toast } from "sonner";
import {
  Asset,
  Item,
  Location,
  createAsset,
  getAssets,
  getAssetsExportUrl,
  getItems,
  getLocations,
} from "@/lib/api";

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const itemSelectRef = useRef<HTMLSelectElement | null>(null);
  const statusFromUrl = searchParams.get("status");
  const locationFromUrl = searchParams.get("locationId");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [itemId, setItemId] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [createPanelOpen, setCreatePanelOpen] = useState(false);

  useEffect(() => {
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  useEffect(() => {
    if (locationFromUrl) {
      setLocationFilter(locationFromUrl);
    }
  }, [locationFromUrl]);

  async function loadData() {
    setDataLoading(true);

    try {
      const [assetsData, itemsData, locationsData] = await Promise.all([
        getAssets(),
        getItems(),
        getLocations(),
      ]);

      setAssets(assetsData);
      setItems(itemsData);
      setLocations(locationsData);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!createPanelOpen) return;

    const frame = window.requestAnimationFrame(() => {
      itemSelectRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [createPanelOpen]);

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
      setCreatePanelOpen(false);
      toast.success("Asset creato correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante la creazione dell'asset.");
    } finally {
      setLoading(false);
    }
  }

  function locationLabel(id: number) {
    const location = locations.find((l) => l.id === id);
    return location ? `${location.code} - ${location.name}` : id;
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

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setLocationFilter("ALL");
    window.history.replaceState(null, "", "/assets");
  }

  function updateStatusFilter(value: string) {
    setStatusFilter(value);
    window.history.replaceState(
      null,
      "",
      value === "ALL" ? "/assets" : `/assets?status=${value}`
    );
  }

  function updateLocationFilter(value: string) {
    setLocationFilter(value);
    window.history.replaceState(
      null,
      "",
      value === "ALL" ? "/assets" : `/assets?locationId=${value}`
    );
  }

  const assetColumns: DataTableColumn<Asset>[] = [
    {
      key: "id",
      header: "ID",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (asset) => asset.id,
    },
    {
      key: "inventory_code",
      header: "Codice",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3 font-mono font-semibold text-blue-700",
      render: (asset) => asset.inventory_code,
    },
    {
      key: "location",
      header: "Sede",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (asset) => locationLabel(asset.current_location_id),
    },
    {
      key: "status",
      header: "Stato",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (asset) => <StatusBadge status={asset.status} />,
    },
    {
      key: "assigned_to",
      header: "Assegnato a",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (asset) => asset.assigned_to ?? "-",
    },
    {
      key: "notes",
      header: "Note",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (asset) => asset.notes ?? "-",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <WorkspaceHeader
        description="Gestione beni inventariati, codici univoci, sedi e stato operativo."
        primaryAction={
          <PrimaryButton
            onClick={() => setCreatePanelOpen((current) => !current)}
            className="h-10 px-4 py-0 text-sm"
          >
            {createPanelOpen ? "Chiudi nuovo asset" : "Nuovo asset"}
          </PrimaryButton>
        }
        secondaryActions={
          <>
            <SecondaryButton href={getAssetsExportUrl()} className="h-10 px-4 py-0 text-sm">
              Esporta Excel
            </SecondaryButton>
            <SecondaryButton href="/items" className="h-10 px-4 py-0 text-sm">
              Catalogo item
            </SecondaryButton>
            <SecondaryButton href="/scan" className="h-10 px-4 py-0 text-sm">
              Apri scanner QR
            </SecondaryButton>
          </>
        }
      />

      {createPanelOpen && (
        <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">Nuovo asset</h2>
              <p className="mt-1 text-sm text-gray-500">
                Crea un bene fisico partendo da una tipologia già presente nel catalogo item.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreatePanelOpen(false)}
              className="self-start rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
            >
              Chiudi
            </button>
          </div>

          <form onSubmit={handleCreateAsset} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_260px_minmax(0,1fr)_160px]">
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Item
              </span>
              <select
                ref={itemSelectRef}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Sede
              </span>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Note
              </span>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                placeholder="Note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <PrimaryButton type="submit" disabled={loading} className="mt-auto px-4 py-3 text-sm">
              {loading ? "Creo..." : "Crea asset"}
            </PrimaryButton>
          </form>
        </section>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CompactStatCard title="Asset totali" value={totalAssets} description="totale" />

        <CompactStatCard
          title="In sede"
          value={inSedeCount}
          active={statusFilter === "IN_SEDE"}
          variant="success"
          onClick={() => updateStatusFilter("IN_SEDE")}
        />

        <CompactStatCard
          title="Assegnati"
          value={assegnatiCount}
          active={statusFilter === "ASSEGNATO"}
          variant="info"
          onClick={() => updateStatusFilter("ASSEGNATO")}
        />

        <CompactStatCard
          title="In evento"
          value={inEventoCount}
          active={statusFilter === "IN_EVENTO"}
          variant="warning"
          onClick={() => updateStatusFilter("IN_EVENTO")}
        />

        <CompactStatCard
          title="Mancanti"
          value={mancantiCount}
          active={statusFilter === "MANCANTE"}
          variant="danger"
          onClick={() => updateStatusFilter("MANCANTE")}
        />
      </section>

      <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-bold text-gray-950">Filtri</h2>
            <p className="text-sm font-medium text-gray-500">
              {filteredAssets.length} asset trovati su {assets.length}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_230px_auto] xl:min-w-[820px]">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Ricerca
              </span>
              <input
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Codice, sede, stato, assegnatario o note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Stato
              </span>
              <select
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={statusFilter}
                onChange={(e) => updateStatusFilter(e.target.value)}
              >
                <option value="ALL">Tutti gli stati</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Sede
              </span>
              <select
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={locationFilter}
                onChange={(e) => updateLocationFilter(e.target.value)}
              >
                <option value="ALL">Tutte le sedi</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} - {location.name}
                  </option>
                ))}
              </select>
            </label>

            <SecondaryButton
              onClick={clearFilters}
              className="mt-auto h-10 px-4 py-0 text-sm"
            >
              Azzera filtri
            </SecondaryButton>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-bold text-gray-950">Risultati</h2>
            <p className="text-sm font-semibold text-gray-500">
              {filteredAssets.length} asset
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {filteredAssets.length} / {assets.length}
          </p>
        </div>

        <DataTable
          columns={assetColumns}
          rows={filteredAssets}
          getRowKey={(asset) => asset.id}
          emptyMessage="Nessun asset trovato con i filtri selezionati."
          loading={dataLoading}
          loadingMessage="Caricamento asset..."
          className="rounded-2xl"
          scrollClassName="max-h-[620px] overflow-auto"
          tableClassName="text-sm"
          headerClassName="[&_th]:px-3 [&_th]:py-3"
          rowClassName={(_, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50/40")}
          onRowClick={(asset) => {
            window.location.href = `/assets/${asset.inventory_code}`;
          }}
          actions={{
            header: "Apri",
            headerClassName: "px-3 py-3",
            cellClassName: "px-3 py-3",
            render: () => (
              <span className="inline-block text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                →
              </span>
            ),
          }}
        />
      </section>
    </main>
  );
}
