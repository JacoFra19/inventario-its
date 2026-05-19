"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/api";

type MovementType = "LOAD" | "UNLOAD" | "RETURN" | "ADJUST";

const movementLabels: Record<MovementType, string> = {
  LOAD: "Carico",
  UNLOAD: "Scarico/consumo",
  RETURN: "Rientro",
  ADJUST: "Correzione inventario",
};

export default function StocksPage() {
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

  async function loadData() {
    const [stocksData, itemsData, locationsData] = await Promise.all([
      getStocks(),
      getItems(),
      getLocations(),
    ]);

    setStocks(stocksData);
    setItems(itemsData);
    setLocations(locationsData);

    if (!selectedStockId && stocksData.length > 0) {
      setSelectedStockId(String(stocksData[0].id));
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selectedStock = stocks.find(
    (stock) => stock.id === Number(selectedStockId)
  );

  useEffect(() => {
    async function loadHistory() {
      if (!selectedStock) {
        setHistory([]);
        return;
      }

      setHistoryLoading(true);

      try {
        const historyData = await getStockHistory(selectedStock.id);
        setHistory(historyData);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [selectedStockId, selectedStock?.id]);

  const nonSerializedItems = useMemo(
    () => items.filter((item) => !item.is_serialized),
    [items]
  );

  const lowStockCount = stocks.filter(
    (stock) => stock.quantity <= stock.min_threshold
  ).length;

  function itemLabel(itemId: number) {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.name} (${item.category})` : `Item ID ${itemId}`;
  }

  function locationLabel(locationId: number) {
    const location = locations.find((l) => l.id === locationId);
    return location ? `${location.code} - ${location.name}` : `Sede ID ${locationId}`;
  }

  function stockLabel(stock: StockCard) {
    return `${itemLabel(stock.item_id)} — ${locationLabel(stock.location_id)}`;
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
      await loadData();
      alert("Scheda stock creata correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante la creazione dello stock. Potrebbe già esistere per questo item e questa sede.");
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
      alert("Movimento stock registrato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante il movimento stock. Controlla quantità disponibile o backend.");
    } finally {
      setMovementLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="/" className="text-blue-600 hover:underline">
            ← Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">Stock e consumabili</h1>
          <p className="text-gray-600">
            Gestione quantità per gadget, materiale promozionale, cavi e consumabili.
          </p>
        </div>

        <a
          href="/assets"
          className="rounded-xl border px-5 py-3 text-center font-semibold hover:bg-white"
        >
          Vai agli Asset
        </a>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Schede stock</p>
          <p className="text-3xl font-bold">{stocks.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Totale pezzi disponibili</p>
          <p className="text-3xl font-bold">
            {stocks.reduce((total, stock) => total + stock.quantity, 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Sotto soglia</p>
          <p className="text-3xl font-bold">{lowStockCount}</p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Seleziona stockcard</h2>

        {loading ? (
          <p className="text-gray-500">Caricamento stock...</p>
        ) : stocks.length === 0 ? (
          <p className="text-gray-500">Nessuna stockcard presente. Creane una dal modulo sotto.</p>
        ) : (
          <select
            className="w-full rounded-xl border p-3"
            value={selectedStockId}
            onChange={(e) => setSelectedStockId(e.target.value)}
          >
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stockLabel(stock)}
              </option>
            ))}
          </select>
        )}
      </section>

      {selectedStock && (
        <section className="mb-8 rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {itemLabel(selectedStock.item_id)}
                </h2>

                {selectedStock.quantity <= selectedStock.min_threshold && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    Sotto soglia
                  </span>
                )}
              </div>

              <p className="mt-2 text-gray-500">
                {locationLabel(selectedStock.location_id)}
              </p>

              {selectedStock.notes && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedStock.notes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Disponibili</p>
                <p className="text-4xl font-bold">{selectedStock.quantity}</p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-gray-500">Soglia minima</p>
                <p className="text-4xl font-bold">{selectedStock.min_threshold}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleMovement} className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-5">
            <select
              className="rounded-xl border p-3"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
            >
              <option value="LOAD">Carico</option>
              <option value="UNLOAD">Scarico/consumo</option>
              <option value="RETURN">Rientro</option>
              <option value="ADJUST">Correzione inventario</option>
            </select>

            <input
              className="rounded-xl border p-3"
              type="number"
              min="0"
              placeholder={movementType === "ADJUST" ? "Nuova quantità" : "Quantità"}
              value={movementQuantity}
              onChange={(e) => setMovementQuantity(e.target.value)}
            />

            <input
              className="rounded-xl border p-3 lg:col-span-2"
              placeholder="Note movimento, es. Fiera Bari, rientro evento..."
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
            />

            <button
              type="submit"
              disabled={movementLoading || !movementQuantity}
              className="rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {movementLoading ? "Salvo..." : "Registra movimento"}
            </button>
          </form>
        </section>
      )}

      {selectedStock && (
        <section className="mb-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Storico movimenti</h2>

          {historyLoading ? (
            <p className="text-gray-500">Caricamento storico...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500">Nessun movimento registrato.</p>
          ) : (
            <div className="space-y-3">
              {history.map((movement) => (
                <div key={movement.id} className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold">
                    {movementLabels[movement.movement_type as MovementType] ?? movement.movement_type} — {movement.quantity} pezzi
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(movement.created_at).toLocaleString("it-IT")}
                  </p>
                  {movement.notes && (
                    <p className="mt-2 text-sm">{movement.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-2 text-xl font-bold">Crea nuova stockcard</h2>
        <p className="mb-4 text-sm text-gray-500">
          La stockcard identifica un item non serializzato in una specifica sede. La quantità iniziale è il carico di partenza, la soglia minima serve per gli avvisi sotto soglia.
        </p>

        <form onSubmit={handleCreateStock} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <select
            className="rounded-xl border p-3"
            value={newStockItemId}
            onChange={(e) => setNewStockItemId(e.target.value)}
          >
            <option value="">Item non serializzato</option>
            {nonSerializedItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border p-3"
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

          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Quantità iniziale"
            value={newStockQuantity}
            onChange={(e) => setNewStockQuantity(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            type="number"
            min="0"
            placeholder="Soglia minima"
            value={newStockThreshold}
            onChange={(e) => setNewStockThreshold(e.target.value)}
          />

          <button
            type="submit"
            disabled={creatingStock || !newStockItemId || !newStockLocationCode}
            className="rounded-xl bg-gray-900 p-3 font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {creatingStock ? "Creo..." : "Crea stockcard"}
          </button>

          <input
            className="rounded-xl border p-3 lg:col-span-5"
            placeholder="Note stockcard"
            value={newStockNotes}
            onChange={(e) => setNewStockNotes(e.target.value)}
          />
        </form>
      </section>
    </main>
  );
}
