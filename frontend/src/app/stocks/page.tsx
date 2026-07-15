"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import CompactStatCard from "@/components/ui/CompactStatCard";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import WorkspaceHeader from "@/components/ui/WorkspaceHeader";
import {
  Item,
  Location,
  StockCard,
  StockMovement,
  createStock,
  createStockMovement,
  getItems,
  getLocations,
  getStockHistory,
  getStocks,
  getStocksExportUrl,
} from "@/lib/api";

type MovementType = "LOAD" | "UNLOAD" | "RETURN" | "ADJUST";

const movementLabels: Record<MovementType, string> = {
  LOAD: "Carico",
  UNLOAD: "Scarico/consumo",
  RETURN: "Rientro",
  ADJUST: "Correzione inventario",
};

export default function StocksPage() {
  const searchParams = useSearchParams();
  const lowStockFromUrl = searchParams.get("lowStock") === "1";
  const locationFromUrl = searchParams.get("locationId");
  const [stocks, setStocks] = useState<StockCard[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStockId, setSelectedStockId] = useState("");
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [movementType, setMovementType] = useState<MovementType>("UNLOAD");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [movementLoading, setMovementLoading] = useState(false);

  const [newStockItemId, setNewStockItemId] = useState("");
  const [newStockLocationCode, setNewStockLocationCode] = useState("");
  const [newStockQuantity, setNewStockQuantity] = useState("0");
  const [newStockThreshold, setNewStockThreshold] = useState("0");
  const [newStockNotes, setNewStockNotes] = useState("");
  const [creatingStock, setCreatingStock] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    if (lowStockFromUrl) {
      setLowStockOnly(true);
    }
  }, [lowStockFromUrl]);

  useEffect(() => {
    if (locationFromUrl) {
      setLocationFilter(locationFromUrl);
    }
  }, [locationFromUrl]);

  const loadData = useCallback(async () => {
    const [stocksData, itemsData, locationsData] = await Promise.all([
      getStocks(),
      getItems(),
      getLocations(),
    ]);

    setStocks(stocksData);
    setItems(itemsData);
    setLocations(locationsData);

    setSelectedStockId((current) => current || (stocksData.length > 0 ? String(stocksData[0].id) : ""));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loadData]);

  const selectedStock = stocks.find(
    (stock) => stock.id === Number(selectedStockId)
  );
  const selectedStockHistoryId = selectedStock?.id;

  useEffect(() => {
    async function loadHistory() {
      if (!selectedStockHistoryId) {
        setHistory([]);
        return;
      }

      setHistoryLoading(true);

      try {
        const historyData = await getStockHistory(selectedStockHistoryId);
        setHistory(historyData);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [selectedStockHistoryId]);

  const nonSerializedItems = useMemo(
    () => items.filter((item) => !item.is_serialized),
    [items]
  );

  const lowStockCount = stocks.filter(
    (stock) => stock.quantity <= stock.min_threshold
  ).length;
  const totalQuantity = stocks.reduce((total, stock) => total + stock.quantity, 0);
  const exhaustedCount = stocks.filter((stock) => stock.quantity <= 0).length;

  const uniqueCategories = useMemo(() => {
    const categoryNames = items
      .map((item) => item.category?.name)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(categoryNames)).sort();
  }, [items]);

  function itemLabel(itemId: number) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return `Item ID ${itemId}`;

    const category = item.category?.name ?? "Categoria non impostata";
    const brand = item.brand ? ` - ${item.brand}` : "";
    const model = item.model ? ` ${item.model}` : "";

    return `${item.name}${brand}${model} (${category})`;
  }

  function locationLabel(locationId: number) {
    const location = locations.find((l) => l.id === locationId);
    return location ? `${location.code} - ${location.name}` : `Sede ID ${locationId}`;
  }

  const stockItem = useCallback((stock: StockCard) => {
    return items.find((item) => item.id === stock.item_id);
  }, [items]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const item = stockItem(stock);
      const location = locations.find((l) => l.id === stock.location_id);

      const matchesLocation =
        locationFilter === "ALL" || stock.location_id === Number(locationFilter);

      const matchesCategory =
        categoryFilter === "ALL" || item?.category?.name === categoryFilter;

      const matchesLowStock =
        !lowStockOnly || stock.quantity <= stock.min_threshold;

      const text = [
        item?.name ?? "",
        item?.category?.name ?? "",
        item?.brand ?? "",
        item?.model ?? "",
        item?.technical_specs ?? "",
        location?.code ?? "",
        location?.name ?? "",
        stock.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      return matchesLocation && matchesCategory && matchesLowStock && matchesSearch;
    });
  }, [stocks, stockItem, locations, locationFilter, categoryFilter, lowStockOnly, search]);

  function clearFilters() {
    setSearch("");
    setLocationFilter("ALL");
    setCategoryFilter("ALL");
    setLowStockOnly(false);
    window.history.replaceState(null, "", "/stocks");
  }

  async function refreshSelectedStock(stockId: number) {
    await loadData();
    const historyData = await getStockHistory(stockId);
    setHistory(historyData);
  }

  async function handleCreateStock(e: React.FormEvent) {
    e.preventDefault();
    if (!newStockItemId || !newStockLocationCode) return;

    setCreatingStock(true);

    try {
      const created = await createStock({
        itemId: Number(newStockItemId),
        locationCode: newStockLocationCode,
        quantity: Number(newStockQuantity),
        minThreshold: Number(newStockThreshold),
        notes: newStockNotes,
      });

      setNewStockItemId("");
      setNewStockLocationCode("");
      setNewStockQuantity("0");
      setNewStockThreshold("0");
      setNewStockNotes("");
      setSelectedStockId(String(created.id));
      setCreatePanelOpen(false);
      await loadData();
      toast.success("Stockcard creata correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante la creazione della stockcard.");
    } finally {
      setCreatingStock(false);
    }
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStock || !movementQuantity) return;

    setMovementLoading(true);

    try {
      await createStockMovement({
        stockId: selectedStock.id,
        movementType,
        quantity: Number(movementQuantity),
        notes: movementNotes,
      });

      setMovementType("UNLOAD");
      setMovementQuantity("");
      setMovementNotes("");
      await refreshSelectedStock(selectedStock.id);
      toast.success("Movimento registrato correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante la registrazione del movimento.");
    } finally {
      setMovementLoading(false);
    }
  }

  const stockColumns: DataTableColumn<StockCard>[] = [
    {
      key: "item",
      header: "Item",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3 font-semibold text-gray-950",
      render: (stock) => itemLabel(stock.item_id),
    },
    {
      key: "location",
      header: "Sede",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (stock) => locationLabel(stock.location_id),
    },
    {
      key: "quantity",
      header: "Disponibili",
      headerClassName: "px-3 py-3 text-right",
      cellClassName: "px-3 py-3 text-right font-bold text-gray-950",
      render: (stock) => stock.quantity,
    },
    {
      key: "min_threshold",
      header: "Soglia",
      headerClassName: "px-3 py-3 text-right",
      cellClassName: "px-3 py-3 text-right",
      render: (stock) => stock.min_threshold,
    },
    {
      key: "status",
      header: "Stato",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3",
      render: (stock) =>
        stock.quantity <= stock.min_threshold ? (
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            Sotto soglia
          </span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            OK
          </span>
        ),
    },
    {
      key: "notes",
      header: "Note",
      headerClassName: "px-3 py-3",
      cellClassName: "px-3 py-3 text-gray-600",
      render: (stock) => stock.notes ?? "-",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <WorkspaceHeader
        description="Gestione quantità, soglie minime e movimenti per materiale consumabile."
        primaryAction={
          <PrimaryButton
            onClick={() => setCreatePanelOpen((current) => !current)}
            className="h-10 px-4 py-0 text-sm"
          >
            {createPanelOpen ? "Chiudi stockcard" : "Nuova stockcard"}
          </PrimaryButton>
        }
        secondaryActions={
          <>
            <SecondaryButton href={getStocksExportUrl()} className="h-10 px-4 py-0 text-sm">
              Esporta Excel
            </SecondaryButton>

            <SecondaryButton href="/assets" className="h-10 px-4 py-0 text-sm">
              Vai agli Asset
            </SecondaryButton>
          </>
        }
      />

      {createPanelOpen && (
        <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">Nuova stockcard</h2>
              <p className="mt-1 text-sm text-gray-500">
                Crea una scheda consumabile per un item non serializzato in una sede.
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

          <form onSubmit={handleCreateStock} className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_240px_150px_150px_160px]">
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Item
              </span>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                value={newStockItemId}
                onChange={(e) => setNewStockItemId(e.target.value)}
              >
                <option value="">Item non serializzato</option>
                {nonSerializedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {itemLabel(item.id)}
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
                value={newStockLocationCode}
                onChange={(e) => setNewStockLocationCode(e.target.value)}
              >
                <option value="">Sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.code}>
                    {location.code} - {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Quantità
              </span>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                type="number"
                min="0"
                placeholder="0"
                value={newStockQuantity}
                onChange={(e) => setNewStockQuantity(e.target.value)}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Soglia
              </span>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                type="number"
                min="0"
                placeholder="0"
                value={newStockThreshold}
                onChange={(e) => setNewStockThreshold(e.target.value)}
              />
            </label>

            <PrimaryButton
              type="submit"
              disabled={creatingStock || !newStockItemId || !newStockLocationCode}
              className="mt-auto px-4 py-3 text-sm"
            >
              {creatingStock ? "Creo..." : "Crea stockcard"}
            </PrimaryButton>

            <label className="lg:col-span-5">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                Note
              </span>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                placeholder="Note stockcard"
                value={newStockNotes}
                onChange={(e) => setNewStockNotes(e.target.value)}
              />
            </label>
          </form>
        </section>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactStatCard title="Articoli monitorati" value={stocks.length} description="stockcard" />

        <CompactStatCard
          title="Quantità totale"
          value={totalQuantity}
          description="pezzi"
          variant="info"
        />

        <CompactStatCard
          title="Sotto soglia"
          value={lowStockCount}
          active={lowStockOnly}
          variant="danger"
          onClick={() => {
            setLowStockOnly(true);
            window.history.replaceState(null, "", "/stocks?lowStock=1");
          }}
        />

        <CompactStatCard
          title="Esauriti"
          value={exhaustedCount}
          variant="warning"
        />
      </section>

      <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100 md:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-bold text-gray-950">Filtri</h2>
            <p className="text-sm font-medium text-gray-500">
              {filteredStocks.length} stockcard trovate su {stocks.length}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_210px_230px_170px_auto] xl:min-w-0 xl:flex-1">
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Ricerca
              </span>
              <input
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Item, marca, modello, sede, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Categoria
              </span>
              <select
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">Tutte le categorie</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
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
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  window.history.replaceState(
                    null,
                    "",
                    e.target.value === "ALL" ? "/stocks" : `/stocks?locationId=${e.target.value}`
                  );
                }}
              >
                <option value="ALL">Tutte le sedi</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} - {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-auto flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 shadow-sm">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  window.history.replaceState(
                    null,
                    "",
                    e.target.checked ? "/stocks?lowStock=1" : "/stocks"
                  );
                }}
              />
              Solo sotto soglia
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

      <section className="mb-5">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-bold text-gray-950">Risultati</h2>
            <p className="text-sm font-semibold text-gray-500">
              {filteredStocks.length} stockcard
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {filteredStocks.length} / {stocks.length}
          </p>
        </div>

        <DataTable
          columns={stockColumns}
          rows={filteredStocks}
          getRowKey={(stock) => stock.id}
          emptyMessage="Nessuna stockcard trovata con i filtri selezionati."
          loading={loading}
          loadingMessage="Caricamento stock..."
          className="rounded-2xl"
          scrollClassName="max-h-[560px] overflow-auto"
          tableClassName="text-sm"
          headerClassName="[&_th]:px-3 [&_th]:py-3"
          rowClassName={(stock, index) =>
            [
              stock.id === Number(selectedStockId) ? "bg-blue-50/70" : index % 2 === 0 ? "bg-white" : "bg-gray-50/40",
            ].join(" ")
          }
          onRowClick={(stock) => setSelectedStockId(String(stock.id))}
          actions={{
            header: "Selezione",
            headerClassName: "px-3 py-3",
            cellClassName: "px-3 py-3",
            render: (stock) => (
              <span className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 transition group-hover:border-blue-200 group-hover:text-blue-700">
                {stock.id === Number(selectedStockId) ? "Selezionata" : "Apri"}
              </span>
            ),
          }}
        />
      </section>

      {selectedStock && (
        <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-gray-950">
                  {itemLabel(selectedStock.item_id)}
                </h2>

                {selectedStock.quantity <= selectedStock.min_threshold && (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    Sotto soglia
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {locationLabel(selectedStock.location_id)}
              </p>

              {selectedStock.notes && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedStock.notes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[260px]">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Disponibili</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">{selectedStock.quantity}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 shadow-sm ring-1 ring-gray-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Soglia minima</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">{selectedStock.min_threshold}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleMovement} className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[190px_160px_minmax(0,1fr)_190px]">
            <select
              className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
            >
              <option value="LOAD">Carico</option>
              <option value="UNLOAD">Scarico/consumo</option>
              <option value="RETURN">Rientro</option>
              <option value="ADJUST">Correzione inventario</option>
            </select>

            <input
              className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              type="number"
              min="0"
              placeholder={movementType === "ADJUST" ? "Nuova quantità" : "Quantità"}
              value={movementQuantity}
              onChange={(e) => setMovementQuantity(e.target.value)}
            />

            <input
              className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Note movimento, es. Fiera Bari, rientro evento..."
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
            />

            <PrimaryButton
              type="submit"
              disabled={movementLoading || !movementQuantity}
              className="px-4 py-3 text-sm"
            >
              {movementLoading ? "Salvo..." : "Registra movimento"}
            </PrimaryButton>
          </form>
        </section>
      )}

      {selectedStock && (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-bold text-gray-950">Storico movimenti</h2>
            <p className="text-sm font-medium text-gray-500">
              {history.length} movimenti
            </p>
          </div>

          {historyLoading ? (
            <p className="text-gray-500">Caricamento storico...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Nessun movimento registrato.</p>
          ) : (
            <div className="space-y-2">
              {history.map((movement) => (
                <div key={movement.id} className="rounded-2xl bg-gray-50/70 p-3 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                  <p className="font-semibold text-gray-950">
                    {movementLabels[movement.movement_type as MovementType] ?? movement.movement_type} - {movement.quantity} pezzi
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(movement.created_at).toLocaleString("it-IT")}
                  </p>
                  {movement.notes && (
                    <p className="mt-2 text-sm text-gray-700">{movement.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
