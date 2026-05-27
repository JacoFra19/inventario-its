

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Asset,
  Event,
  EventDetail,
  StockCard,
  addAssetToEvent,
  addStockToEvent,
  cancelEvent,
  closeEvent,
  markEventAssetMissing,
  returnEventAsset,
  returnEventStock,
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

import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import DangerButton from "@/components/ui/DangerButton";
import StatusBadge from "@/components/StatusBadge";


export default function EventsPage() {
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("eventId");
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
  const [returningMaterial, setReturningMaterial] = useState(false);
  const [eventActionLoading, setEventActionLoading] = useState(false);
  const [stockReturnQuantities, setStockReturnQuantities] = useState<Record<number, string>>({});
  const [stockReturnNotes, setStockReturnNotes] = useState<Record<number, string>>({});

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

    if (eventIdFromUrl) {
      const eventExists = eventsData.some(
        (event) => event.id === Number(eventIdFromUrl)
      );

      if (eventExists) {
        setSelectedEventId(eventIdFromUrl);
        return;
      }
    }

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
  }, [eventIdFromUrl]);

  useEffect(() => {
    loadEventDetail(selectedEventId);
  }, [selectedEventId]);

  const selectedEvent = eventDetail?.event ?? null;
  const eventIsOpen = selectedEvent?.status === "OPEN";

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

  function getReadableError(error: unknown) {
    if (!(error instanceof Error)) {
      return "Operazione non riuscita.";
    }

    try {
      const parsed = JSON.parse(error.message) as { detail?: string };
      return parsed.detail ?? error.message;
    } catch {
      return error.message;
    }
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

  async function handleReturnAsset(eventAssetId: number) {
    if (!selectedEvent) return;

    setReturningMaterial(true);

    try {
      await returnEventAsset({
        eventId: selectedEvent.id,
        eventAssetId,
      });

      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Asset rientrato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante il rientro asset.");
    } finally {
      setReturningMaterial(false);
    }
  }

  async function handleMissingAsset(eventAssetId: number) {
    if (!selectedEvent) return;

    setReturningMaterial(true);

    try {
      await markEventAssetMissing({
        eventId: selectedEvent.id,
        eventAssetId,
      });

      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Asset segnato come mancante");
    } catch (error) {
      console.error(error);
      alert("Errore durante l'aggiornamento asset.");
    } finally {
      setReturningMaterial(false);
    }
  }

  async function handleReturnStock(eventStockId: number) {
    if (!selectedEvent) return;

    const quantity = stockReturnQuantities[eventStockId];
    if (!quantity) return;

    setReturningMaterial(true);

    try {
      await returnEventStock({
        eventId: selectedEvent.id,
        eventStockId,
        quantityReturned: Number(quantity),
        notes: stockReturnNotes[eventStockId],
      });

      setStockReturnQuantities((prev) => ({
        ...prev,
        [eventStockId]: "",
      }));

      setStockReturnNotes((prev) => ({
        ...prev,
        [eventStockId]: "",
      }));

      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Rientro stock registrato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante il rientro stock.");
    } finally {
      setReturningMaterial(false);
    }
  }

  async function handleCloseEvent() {
    if (!selectedEvent) return;

    setEventActionLoading(true);

    try {
      await closeEvent(selectedEvent.id);
      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Evento chiuso correttamente");
    } catch (error) {
      alert(getReadableError(error));
    } finally {
      setEventActionLoading(false);
    }
  }

  async function handleCancelEvent() {
    if (!selectedEvent) return;

    const confirmed = window.confirm(
      "Vuoi davvero annullare questo evento? L'operazione è consentita solo se non ci sono materiali collegati."
    );

    if (!confirmed) return;

    setEventActionLoading(true);

    try {
      await cancelEvent(selectedEvent.id);
      await loadData();
      await loadEventDetail(String(selectedEvent.id));
      alert("Evento annullato correttamente");
    } catch (error) {
      alert(getReadableError(error));
    } finally {
      setEventActionLoading(false);
    }
  }

  function handlePrintReport() {
    window.print();
  }

  function reportDate(value: string | null) {
    return value || "-";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="print:hidden">
        <PageHeader
          backHref="/"
          backLabel="Dashboard"
          eyebrow="Logistica eventi"
          title="Eventi e fiere"
          description="Gestione del materiale in uscita per eventi, fiere e attività esterne."
          actions={
            <>
              {selectedEvent && (
                <PrimaryButton onClick={handlePrintReport}>
                  Stampa report
                </PrimaryButton>
              )}

              <SecondaryButton href="/stocks">
                Vai agli Stock
              </SecondaryButton>
            </>
          }
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 print:hidden">
        <StatCard title="Eventi totali" value={events.length} />

        <StatCard
          title="Eventi aperti"
          value={events.filter((event) => event.status === "OPEN").length}
          variant="info"
          badge={<StatusBadge status="OPEN" size="sm" />}
        />

        <StatCard
          title="Materiali collegati"
          value={(eventDetail?.assets.length ?? 0) + (eventDetail?.stocks.length ?? 0)}
        />
      </div>

      <SectionCard className="mb-8 print:hidden" title="Crea nuovo evento">

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

          <PrimaryButton
            type="submit"
            disabled={creatingEvent || !newEventName.trim()}
            className="p-3"
          >
            {creatingEvent ? "Creo..." : "Crea evento"}
          </PrimaryButton>

          <input
            className="rounded-xl border p-3 lg:col-span-3"
            placeholder="Note evento"
            value={newEventNotes}
            onChange={(e) => setNewEventNotes(e.target.value)}
          />
        </form>
      </SectionCard>

      <SectionCard className="mb-8 print:hidden" title="Seleziona evento">

        {loading ? (
          <p className="text-gray-500">Caricamento eventi...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">Nessun evento presente. Creane uno dal modulo sopra.</p>
        ) : (
          <select
            className="w-full rounded-xl border p-3"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              window.history.replaceState(null, "", `/events?eventId=${e.target.value}`);
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} — {event.location ?? "Luogo non indicato"} — {event.status}
              </option>
            ))}
          </select>
        )}
      </SectionCard>

      {selectedEvent && (
        <SectionCard className="mb-8 print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
                <StatusBadge status={selectedEvent.status} />
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

            <div className="flex flex-col gap-2 sm:flex-row">
              <PrimaryButton
                onClick={handleCloseEvent}
                disabled={eventActionLoading || !eventIsOpen}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Chiudi evento
              </PrimaryButton>

              <DangerButton
                onClick={handleCancelEvent}
                disabled={eventActionLoading || !eventIsOpen}
              >
                Annulla evento
              </DangerButton>
            </div>
          </div>

          {!eventIsOpen && (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm text-gray-600 ring-1 ring-gray-100">
              Questo evento non è aperto. Le operazioni di aggiunta materiale e rientro sono bloccate.
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <form onSubmit={handleAddAsset} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm ring-1 ring-gray-100">
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

                <PrimaryButton
                  type="submit"
                  disabled={addingMaterial || !assetIdToAdd || !eventIsOpen}
                  className="w-full bg-blue-600 p-3 hover:bg-blue-700"
                >
                  Aggiungi asset
                </PrimaryButton>
              </div>
            </form>

            <form onSubmit={handleAddStock} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm ring-1 ring-gray-100">
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

                <PrimaryButton
                  type="submit"
                  disabled={addingMaterial || !stockIdToAdd || !stockQuantity || !eventIsOpen}
                  className="w-full bg-emerald-600 p-3 hover:bg-emerald-700"
                >
                  Aggiungi stock
                </PrimaryButton>
              </div>
            </form>
          </div>
        </SectionCard>
      )}

      {eventDetail && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
          <SectionCard title="Asset collegati">
            {eventDetail.assets.length === 0 ? (
              <p className="text-gray-500">Nessun asset collegato.</p>
            ) : (
              <div className="space-y-3">
                {eventDetail.assets.map((eventAsset) => (
                  <div
                    key={eventAsset.id}
                    className="rounded-2xl bg-gray-50/70 p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">{linkedAssetLabel(eventAsset.asset_id)}</p>
                        <div className="mt-2">
                          <StatusBadge status={eventAsset.status} size="sm" />
                        </div>
                        {eventAsset.notes && (
                          <p className="mt-2 text-sm">{eventAsset.notes}</p>
                        )}
                      </div>

                      {eventAsset.status === "OUT" && (
                        <div className="flex gap-2">
                          <PrimaryButton
                            onClick={() => handleReturnAsset(eventAsset.id)}
                            disabled={returningMaterial || !eventIsOpen}
                            className="bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-700"
                          >
                            Rientrato
                          </PrimaryButton>

                          <DangerButton
                            onClick={() => handleMissingAsset(eventAsset.id)}
                            disabled={returningMaterial || !eventIsOpen}
                            className="border-red-600 bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                          >
                            Mancante
                          </DangerButton>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Stock collegati">
            {eventDetail.stocks.length === 0 ? (
              <p className="text-gray-500">Nessuno stock collegato.</p>
            ) : (
              <div className="space-y-3">
                {eventDetail.stocks.map((eventStock) => {
                  const remaining =
                    eventStock.quantity_out - eventStock.quantity_returned;

                  return (
                    <div
                      key={eventStock.id}
                      className="rounded-2xl bg-gray-50/70 p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
                    >
                      <p className="font-semibold">
                        {linkedStockLabel(eventStock.stock_card_id)}
                      </p>

                      <p className="text-sm text-gray-500">
                        Usciti: {eventStock.quantity_out} — Rientrati: {eventStock.quantity_returned}
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        Da rientrare: {remaining}
                      </p>

                      {eventStock.notes && (
                        <p className="mt-2 text-sm">{eventStock.notes}</p>
                      )}

                      {remaining > 0 && (
                        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                          <input
                            className="rounded-xl border p-3"
                            type="number"
                            min="1"
                            max={remaining}
                            placeholder="Quantità rientrata"
                            value={stockReturnQuantities[eventStock.id] ?? ""}
                            onChange={(e) =>
                              setStockReturnQuantities((prev) => ({
                                ...prev,
                                [eventStock.id]: e.target.value,
                              }))
                            }
                          />

                          <input
                            className="rounded-xl border p-3"
                            placeholder="Note rientro"
                            value={stockReturnNotes[eventStock.id] ?? ""}
                            onChange={(e) =>
                              setStockReturnNotes((prev) => ({
                                ...prev,
                                [eventStock.id]: e.target.value,
                              }))
                            }
                          />

                          <PrimaryButton
                            onClick={() => handleReturnStock(eventStock.id)}
                            disabled={
                              returningMaterial ||
                              !eventIsOpen ||
                              !(stockReturnQuantities[eventStock.id] ?? "")
                            }
                            className="bg-emerald-600 p-3 hover:bg-emerald-700"
                          >
                            Registra rientro
                          </PrimaryButton>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      )}
      {selectedEvent && eventDetail && (
        <section className="hidden print:block print:p-8">
          <div className="border-b pb-4">
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Report logistico evento
            </p>
            <h1 className="mt-2 text-3xl font-bold">{selectedEvent.name}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Stato: {selectedEvent.status}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Luogo</p>
              <p>{selectedEvent.location ?? "-"}</p>
            </div>

            <div>
              <p className="font-semibold">Referente</p>
              <p>{selectedEvent.manager ?? "-"}</p>
            </div>

            <div>
              <p className="font-semibold">Data inizio</p>
              <p>{reportDate(selectedEvent.start_date)}</p>
            </div>

            <div>
              <p className="font-semibold">Data fine</p>
              <p>{reportDate(selectedEvent.end_date)}</p>
            </div>
          </div>

          {selectedEvent.notes && (
            <div className="mt-6 text-sm">
              <p className="font-semibold">Note evento</p>
              <p>{selectedEvent.notes}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-xl font-bold">Asset serializzati</h2>

            {eventDetail.assets.length === 0 ? (
              <p className="text-sm text-gray-600">Nessun asset collegato.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Codice</th>
                    <th className="border p-2 text-left">Stato</th>
                    <th className="border p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {eventDetail.assets.map((eventAsset) => (
                    <tr key={eventAsset.id}>
                      <td className="border p-2">{linkedAssetLabel(eventAsset.asset_id)}</td>
                      <td className="border p-2">{eventAsset.status}</td>
                      <td className="border p-2">{eventAsset.notes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-xl font-bold">Stock e consumabili</h2>

            {eventDetail.stocks.length === 0 ? (
              <p className="text-sm text-gray-600">Nessuno stock collegato.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Stockcard</th>
                    <th className="border p-2 text-left">Usciti</th>
                    <th className="border p-2 text-left">Rientrati</th>
                    <th className="border p-2 text-left">Da rientrare</th>
                    <th className="border p-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {eventDetail.stocks.map((eventStock) => {
                    const remaining =
                      eventStock.quantity_out - eventStock.quantity_returned;

                    return (
                      <tr key={eventStock.id}>
                        <td className="border p-2">{linkedStockLabel(eventStock.stock_card_id)}</td>
                        <td className="border p-2">{eventStock.quantity_out}</td>
                        <td className="border p-2">{eventStock.quantity_returned}</td>
                        <td className="border p-2">{remaining}</td>
                        <td className="border p-2">{eventStock.notes ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
            <div>
              <p className="border-t pt-2 font-semibold">Firma consegna</p>
            </div>
            <div>
              <p className="border-t pt-2 font-semibold">Firma rientro</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}