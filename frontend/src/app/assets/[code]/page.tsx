"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  assignAsset,
  getAssetDetail,
  getAssetHistory,
  getAssetLogs,
  markAssetMissing,
  restoreAsset,
  transferAsset,
  unassignAsset,
  type AssetDetail,
  type AssetLog,
  type AssetTransferMovement,
} from "@/lib/api";

import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

type Asset = {
  id: number;
  inventory_code: string;
  current_location_id: number;
  status: string;
  assigned_to: string | null;
  notes: string | null;
};

type Location = {
  id: number;
  code: string;
  name: string;
};

type Props = {
  params: Promise<{
    code: string;
  }>;
};

type ConfirmAction = "missing" | "restore" | null;

export default function AssetDetailPage({ params }: Props) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetDetail, setAssetDetail] = useState<AssetDetail | null>(null);
  const [history, setHistory] = useState<AssetTransferMovement[]>([]);
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [missingLoading, setMissingLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    async function load() {
      const { code } = await params;

      const [detailData, locationsRes] = await Promise.all([
        getAssetDetail(code),
        fetch(`http://localhost:8000/locations`, {
          cache: "no-store",
        }),
      ]);

      const locationsData = await locationsRes.json();

      setAssetDetail(detailData);
      setAsset(detailData.asset);
      setAssignedTo(detailData.asset.assigned_to ?? "");
      setLocations(locationsData);

      const [historyData, logsData] = await Promise.all([
        getAssetHistory(detailData.asset.id),
        getAssetLogs(detailData.asset.id),
      ]);
      setHistory(historyData);
      setLogs(logsData);
    }

    load();
  }, [params]);

  async function refreshAssetDetail(inventoryCode: string) {
    const detailData = await getAssetDetail(inventoryCode);
    setAssetDetail(detailData);
    setAsset(detailData.asset);
    setAssignedTo(detailData.asset.assigned_to ?? "");
    return detailData.asset;
  }

  async function refreshAssetLogs(assetId: number) {
    const logsData = await getAssetLogs(assetId);
    setLogs(logsData);
  }

  async function handleTransfer() {
    if (!asset || !selectedLocation) return;

    setLoading(true);

    try {
      await transferAsset({
        assetId: asset.id,
        toLocationCode: selectedLocation,
      });

      const refreshedAsset = await refreshAssetDetail(asset.inventory_code);

      const historyData = await getAssetHistory(refreshedAsset.id);
      setHistory(historyData);
      await refreshAssetLogs(refreshedAsset.id);
      setSelectedLocation("");
      toast.success("Asset trasferito correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il trasferimento dell'asset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!asset || !assignedTo.trim()) return;

    setAssignLoading(true);

    try {
      const updatedAsset = await assignAsset({
        assetId: asset.id,
        assignedTo: assignedTo.trim(),
      });

      const refreshedAsset = await refreshAssetDetail(updatedAsset.inventory_code);
      await refreshAssetLogs(refreshedAsset.id);
      toast.success("Asset assegnato correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'assegnazione dell'asset.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleUnassign() {
    if (!asset) return;

    setAssignLoading(true);

    try {
      const updatedAsset = await unassignAsset(asset.id);

      const refreshedAsset = await refreshAssetDetail(updatedAsset.inventory_code);
      await refreshAssetLogs(refreshedAsset.id);
      toast.success("Assegnazione rimossa correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante la rimozione dell'assegnazione.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleMarkMissing() {
    if (!asset) return;

    setMissingLoading(true);

    try {
      const updatedAsset = await markAssetMissing({
        assetId: asset.id,
        notes: asset.notes ?? undefined,
      });

      const refreshedAsset = await refreshAssetDetail(updatedAsset.inventory_code);
      await refreshAssetLogs(refreshedAsset.id);
      toast.success("Asset segnato come mancante");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'aggiornamento dello stato mancante.");
    } finally {
      setMissingLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleRestoreAsset() {
    if (!asset) return;

    setRestoreLoading(true);

    try {
      const updatedAsset = await restoreAsset(asset.id);

      const refreshedAsset = await refreshAssetDetail(updatedAsset.inventory_code);
      await refreshAssetLogs(refreshedAsset.id);
      toast.success("Asset ripristinato correttamente");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il ripristino dell'asset.");
    } finally {
      setRestoreLoading(false);
      setConfirmAction(null);
    }
  }

  function locationName(id: number | null) {
    if (id === null) return "Sede iniziale non registrata";

    const location = locations.find((l) => l.id === id);
    return location ? `${location.code} - ${location.name}` : `Sede ID ${id}`;
  }

  function currentLocationName() {
    return locationName(asset?.current_location_id ?? null);
  }

  function assetLogBadgeClass(actionType: string) {
    if (actionType === "CREATE") return "bg-gray-100 text-gray-700";
    if (actionType === "TRANSFER") return "bg-blue-100 text-blue-700";
    if (actionType === "ASSIGN") return "bg-indigo-100 text-indigo-700";
    if (actionType === "UNASSIGN") return "bg-slate-100 text-slate-700";
    if (actionType === "MARK_MISSING" || actionType === "EVENT_MISSING") return "bg-red-100 text-red-700";
    if (actionType === "RESTORE" || actionType === "EVENT_RETURN") return "bg-emerald-100 text-emerald-700";
    if (actionType === "EVENT_OUT") return "bg-orange-100 text-orange-700";

    return "bg-gray-100 text-gray-700";
  }

  const item = assetDetail?.item;

  if (!asset) {
    return <main className="p-10">Caricamento asset...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === "restore" ? "Ripristinare asset?" : "Segnare asset mancante?"}
        description={
          confirmAction === "restore"
            ? "L'asset verrà riportato allo stato IN_SEDE."
            : "L'asset verrà segnato come MANCANTE."
        }
        confirmLabel={confirmAction === "restore" ? "Ripristina" : "Segna mancante"}
        cancelLabel="Annulla"
        variant={confirmAction === "restore" ? "default" : "danger"}
        onConfirm={() => {
          if (confirmAction === "restore") {
            handleRestoreAsset();
            return;
          }

          if (confirmAction === "missing") {
            handleMarkMissing();
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <Link
        href="/assets"
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-blue-50"
      >
        ← Torna alla lista
      </Link>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow ring-1 ring-gray-100 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Asset inventariato
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                  {asset.inventory_code}
                </h1>
              </div>

              <StatusBadge status={asset.status} />
            </div>

            <p className="mt-5 max-w-3xl text-gray-500">
              {item
                ? `${item.name}${item.brand ? ` • ${item.brand}` : ""}${item.model ? ` ${item.model}` : ""}`
                : "Gestione dettaglio asset e QR."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 xl:w-[260px]">
            <img
              src={`http://localhost:8000/assets/${asset.inventory_code}/qr`}
              alt="QR Code"
              className="mx-auto h-40 w-40 rounded-2xl bg-white p-2 shadow-sm"
            />

            {asset.status === "MANCANTE" ? (
              <button
                onClick={() => setConfirmAction("restore")}
                disabled={restoreLoading}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {restoreLoading ? "Ripristino..." : "Ripristina asset"}
              </button>
            ) : (
              <button
                onClick={() => setConfirmAction("missing")}
                disabled={missingLoading}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {missingLoading ? "Aggiorno..." : "Segna come mancante"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">ID</p>
            <p className="mt-1 font-semibold">{asset.id}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Stato</p>
            <div className="mt-2">
              <StatusBadge status={asset.status} />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Sede attuale</p>
            <p className="mt-1 font-semibold">
              {currentLocationName()}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Assegnato a</p>
            <p className="mt-1 font-semibold">
              {asset.assigned_to ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Storico operativo</h2>

          {logs.length === 0 ? (
            <p className="text-gray-500">Nessuna azione operativa registrata.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="font-semibold">{log.description}</p>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${assetLogBadgeClass(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString("it-IT")}
                  </p>

                  {log.created_by && (
                    <p className="mt-2 text-sm text-gray-600">
                      Operatore: {log.created_by}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            Scheda tecnica item
          </h2>

          {!item ? (
            <p className="text-gray-500">
              Nessuna informazione item collegata a questo asset.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                <p className="text-sm text-gray-500">Nome oggetto</p>
                <p className="mt-1 font-semibold">{item.name}</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="mt-1 font-semibold">{item.category?.name ?? "-"}</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                <p className="text-sm text-gray-500">Marca</p>
                <p className="mt-1 font-semibold">{item.brand ?? "-"}</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                <p className="text-sm text-gray-500">Modello</p>
                <p className="mt-1 font-semibold">{item.model ?? "-"}</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md md:col-span-2">
                <p className="text-sm text-gray-500">Specifiche tecniche</p>
                <p className="mt-1 whitespace-pre-wrap font-semibold">
                  {item.technical_specs ?? "-"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            Trasferisci asset
          </h2>

          <div className="flex flex-col gap-4 md:flex-row">
            <select
              className="flex-1 rounded-xl border p-3"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Seleziona sede</option>

              {locations.map((location) => (
                <option key={location.id} value={location.code}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleTransfer}
              disabled={loading || !selectedLocation}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Trasferisco..." : "Trasferisci"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">
            Assegnazione a personale
          </h2>

          <div className="flex flex-col gap-4 md:flex-row">
            <input
              className="flex-1 rounded-xl border p-3"
              placeholder="Es. Segreteria, Tutor sede, Ufficio comunicazione..."
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />

            <button
              onClick={handleAssign}
              disabled={assignLoading || !assignedTo.trim()}
              className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              {assignLoading ? "Salvo..." : "Assegna"}
            </button>

            <button
              onClick={handleUnassign}
              disabled={assignLoading || !asset.assigned_to}
              className="rounded-xl border px-6 py-3 font-semibold hover:bg-white disabled:opacity-50"
            >
              Rimuovi
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/70 p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Storico movimenti</h2>

          {history.length === 0 ? (
            <p className="text-gray-500">Nessun movimento registrato.</p>
          ) : (
            <div className="space-y-3">
              {history.map((movement) => (
                <div key={movement.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                  <p className="font-semibold">
                    Da {locationName(movement.from_location_id)} → {locationName(movement.to_location_id)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(movement.moved_at).toLocaleString("it-IT")}
                  </p>
                  {movement.moved_by && (
                    <p className="mt-2 text-sm text-gray-600">
                      Operatore: {movement.moved_by}
                    </p>
                  )}
                  {movement.notes && (
                    <p className="mt-2 text-sm">{movement.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
