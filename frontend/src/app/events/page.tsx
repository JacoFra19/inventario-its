

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Asset,
  Event,
  EventDetail,
  StockCard,
  addAssetToEvent,
  addStockToEvent,
  createEvent,
  getAssets,
  getEvent,
  getEvents,
  getItems,
  getLocations,
  getStocks,
  Item,
  Location,
} from "@/lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stocks, setStocks] = useState<StockCard[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventStartDate, setNewEventStartDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventManager, setNewEventManager] = useState("");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  const [assetIdToAdd, setAssetIdToAdd] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [stockIdToAdd, setStockIdToAdd] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockNotes, setStockNotes] = useState("");
  const [addingMaterial, setAddingMaterial] = useState(false);

  async function loadData() {
    const [eventsData, assetsData, stocksData, itemsData, locationsData] = await Promise.all([
      getEvents(),
      getAssets(),
      getStocks(),
      getItems(),
      getLocations(),
    ]);

    setEvents(eventsData);
    setAssets(assetsData);
    setStocks(stocksData);
    setItems(itemsData);
    setLocations(locationsData);

    if (!selectedEventId && eventsData.length > 0) {
      setSelectedEventId(String(eventsData[0].id));
    }
  }

  async function loadEventDetail(eventId: string) {
    if (!eventId) {
      setEventDetail(null);
      return;
    }

    const detail = await getEvent(Number(eventId));
    setEventDetail(detail);
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

  useEffect(() => {
    loadEventDetail(selectedEventId);
  }, [selectedEventId]);

  const selectedEvent = eventDetail?.event ?? null;

  const availableAssets = useMemo(() => {
    const linkedAssetIds = new Set(eventDetail?.assets.map((a) => a.asset_id) ?? []);
    return assets.filter((asset) => !linkedAssetIds.has(asset.id));
  }, [assets, eventDetail]);

  function itemLabel(itemId: number) {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.name} (${item.category})` : `Item ID ${itemId}`;
  }

  function locationLabel(locationId: number) {
    const location = locations.find((l) => l.id === locationId);
    return location ? `${location.code} - ${location.name}` : `Sede ID ${locationId}`;
  }

  function stockLabel(stock: StockCard) {
    return `${itemLabel(stock.item_id)} — ${locationLabel(stock.location_id)} — disponibili: ${stock.quantity}`;
  }

  function assetLabel(asset: Asset) {
    return `${asset.inventory_code} — stato: ${asset.status}`;
  }

  function linkedAssetLabel(assetId: number) {
    const asset = assets.find((a) => a.id === assetId);
    return asset ? asset.inventory_code : `Asset ID ${assetId}`;
  }

  function linkedStockLabel(stockCardId: number) {
    const stock = stocks.find((s) => s.id === stockCardId);
    return stock ? stockLabel(stock) : `Stock ID ${stockCardId}`;
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newEventName.trim()) return;

    setCreatingEvent(true);

    try {
      const created = await createEvent({
        name: newEventName.trim(),
        location: newEventLocation,
        startDate: newEventStartDate,
        endDate: newEventEndDate,
        manager: newEventManager,
        notes: newEventNotes,
      });

      setNewEventName("");
      setNewEventLocation("");
      setNewEventStartDate("");
      setNewEventEndDate("");
      setNewEventManager("");
      setNewEventNotes("");
      setSelectedEventId(String(created.id));
      await loadData();
      await loadEventDetail(String(created.id));
      alert("Evento creato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante la creazione evento. Controlla console/backend.");
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !assetIdToAdd) return;

    setAddingMaterial(true);

    try {
      await addAssetToEvent({
        eventId: selectedEvent.id,
        assetId: Number(assetIdToAdd),
        notes: assetNotes,
      });

      setAssetIdToAdd("");
      setAssetNotes("");
      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Asset collegato all'evento");
    } catch (error) {
      console.error(error);
      alert("Errore durante il collegamento asset. Potrebbe essere già collegato all'evento.");
    } finally {
      setAddingMaterial(false);
    }
  }

  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !stockIdToAdd || !stockQuantity) return;

    setAddingMaterial(true);

    try {
      await addStockToEvent({
        eventId: selectedEvent.id,
        stockCardId: Number(stockIdToAdd),
        quantityOut: Number(stockQuantity),
        notes: stockNotes,
      });

      setStockIdToAdd("");
      setStockQuantity("");
      setStockNotes("");
      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Stock collegato all'evento e scaricato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante il collegamento stock. Controlla quantità disponibile.");
    } finally {
      setAddingMaterial(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="/" className="text-blue-600 hover:underline">
            ← Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold">Eventi e fiere</h1>
          <p className="text-gray-600">
            Gestione del materiale in uscita per eventi, fiere e attività esterne.
          </p>
        </div>

        <a
          href="/stocks"
          className="rounded-xl border px-5 py-3 text-center font-semibold hover:bg-white"
        >
          Vai agli Stock
        </a>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Eventi totali</p>
          <p className="text-3xl font-bold">{events.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Eventi aperti</p>
          <p className="text-3xl font-bold">
            {events.filter((event) => event.status === "OPEN").length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Materiali collegati</p>
          <p className="text-3xl font-bold">
            {(eventDetail?.assets.length ?? 0) + (eventDetail?.stocks.length ?? 0)}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Crea nuovo evento</h2>

        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <input
            className="rounded-xl border p-3"
            placeholder="Nome evento, es. Fiera test"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            placeholder="Luogo"
            value={newEventLocation}
            onChange={(e) => setNewEventLocation(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            placeholder="Referente"
            value={newEventManager}
            onChange={(e) => setNewEventManager(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            type="date"
            value={newEventStartDate}
            onChange={(e) => setNewEventStartDate(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            type="date"
            value={newEventEndDate}
            onChange={(e) => setNewEventEndDate(e.target.value)}
          />

          <button
            type="submit"
            disabled={creatingEvent || !newEventName.trim()}
            className="rounded-xl bg-gray-900 p-3 font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {creatingEvent ? "Creo..." : "Crea evento"}
          </button>

          <input
            className="rounded-xl border p-3 lg:col-span-3"
            placeholder="Note evento"
            value={newEventNotes}
            onChange={(e) => setNewEventNotes(e.target.value)}
          />
        </form>
      </section>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Seleziona evento</h2>

        {loading ? (
          <p className="text-gray-500">Caricamento eventi...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">Nessun evento presente. Creane uno dal modulo sopra.</p>
        ) : (
          <select
            className="w-full rounded-xl border p-3"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} — {event.location ?? "Luogo non indicato"} — {event.status}
              </option>
            ))}
          </select>
        )}
      </section>

      {selectedEvent && (
        <section className="mb-8 rounded-2xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {selectedEvent.status}
                </span>
              </div>

              <p className="mt-2 text-gray-500">
                {selectedEvent.location ?? "Luogo non indicato"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {selectedEvent.start_date ?? "Data inizio non indicata"} → {selectedEvent.end_date ?? "Data fine non indicata"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Referente: {selectedEvent.manager ?? "-"}
              </p>
              {selectedEvent.notes && (
                <p className="mt-2 text-sm text-gray-600">{selectedEvent.notes}</p>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form onSubmit={handleAddAsset} className="rounded-2xl border bg-gray-50 p-5">
              <h3 className="mb-4 text-lg font-bold">Aggiungi asset serializzato</h3>

              <div className="space-y-3">
                <select
                  className="w-full rounded-xl border p-3"
                  value={assetIdToAdd}
                  onChange={(e) => setAssetIdToAdd(e.target.value)}
                >
                  <option value="">Seleziona asset</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {assetLabel(asset)}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-xl border p-3"
                  placeholder="Note asset"
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={addingMaterial || !assetIdToAdd}
                  className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Aggiungi asset
                </button>
              </div>
            </form>

            <form onSubmit={handleAddStock} className="rounded-2xl border bg-gray-50 p-5">
              <h3 className="mb-4 text-lg font-bold">Aggiungi stock/consumabili</h3>

              <div className="space-y-3">
                <select
                  className="w-full rounded-xl border p-3"
                  value={stockIdToAdd}
                  onChange={(e) => setStockIdToAdd(e.target.value)}
                >
                  <option value="">Seleziona stockcard</option>
                  {stocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stockLabel(stock)}
                    </option>
                  ))}
                </select>

                <input
                  className="w-full rounded-xl border p-3"
                  type="number"
                  min="1"
                  placeholder="Quantità in uscita"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />

                <input
                  className="w-full rounded-xl border p-3"
                  placeholder="Note stock"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={addingMaterial || !stockIdToAdd || !stockQuantity}
                  className="w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Aggiungi stock
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {eventDetail && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Asset collegati</h2>
            {eventDetail.assets.length === 0 ? (
              <p className="text-gray-500">Nessun asset collegato.</p>
            ) : (
              <div className="space-y-3">
                {eventDetail.assets.map((eventAsset) => (
                  <div key={eventAsset.id} className="rounded-xl bg-gray-50 p-4">
                    <p className="font-semibold">{linkedAssetLabel(eventAsset.asset_id)}</p>
                    <p className="text-sm text-gray-500">Stato: {eventAsset.status}</p>
                    {eventAsset.notes && <p className="mt-2 text-sm">{eventAsset.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Stock collegati</h2>
            {eventDetail.stocks.length === 0 ? (
              <p className="text-gray-500">Nessuno stock collegato.</p>
            ) : (
              <div className="space-y-3">
                {eventDetail.stocks.map((eventStock) => (
                  <div key={eventStock.id} className="rounded-xl bg-gray-50 p-4">
                    <p className="font-semibold">{linkedStockLabel(eventStock.stock_card_id)}</p>
                    <p className="text-sm text-gray-500">
                      Usciti: {eventStock.quantity_out} — Rientrati: {eventStock.quantity_returned}
                    </p>
                    {eventStock.notes && <p className="mt-2 text-sm">{eventStock.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}