"use client";

import { useEffect, useState } from "react";
import {
  assignAsset,
  getAssetDetail,
  getAssetHistory,
  markAssetMissing,
  transferAsset,
  unassignAsset,
  type AssetDetail,
  type AssetTransferMovement,
} from "@/lib/api";

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

export default function AssetDetailPage({ params }: Props) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetDetail, setAssetDetail] = useState<AssetDetail | null>(null);
  const [history, setHistory] = useState<AssetTransferMovement[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [missingLoading, setMissingLoading] = useState(false);

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

      const historyData = await getAssetHistory(detailData.asset.id);
      setHistory(historyData);
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
      setSelectedLocation("");
      alert("Asset trasferito correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante il trasferimento. Controlla console/backend.");
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

      await refreshAssetDetail(updatedAsset.inventory_code);
      alert("Asset assegnato correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante l'assegnazione. Controlla console/backend.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleUnassign() {
    if (!asset) return;

    setAssignLoading(true);

    try {
      const updatedAsset = await unassignAsset(asset.id);

      await refreshAssetDetail(updatedAsset.inventory_code);
      alert("Assegnazione rimossa correttamente");
    } catch (error) {
      console.error(error);
      alert("Errore durante la rimozione dell'assegnazione. Controlla console/backend.");
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleMarkMissing() {
    if (!asset) return;

    const confirmed = window.confirm(
      `Vuoi segnare l'asset ${asset.inventory_code} come MANCANTE?`
    );

    if (!confirmed) return;

    setMissingLoading(true);

    try {
      const updatedAsset = await markAssetMissing({
        assetId: asset.id,
        notes: asset.notes ?? undefined,
      });

      await refreshAssetDetail(updatedAsset.inventory_code);
      alert("Asset segnato come mancante");
    } catch (error) {
      console.error(error);
      alert("Errore durante l'aggiornamento dello stato mancante.");
    } finally {
      setMissingLoading(false);
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

  const item = assetDetail?.item;

  if (!asset) {
    return <main className="p-10">Caricamento asset...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <a href="/assets" className="text-blue-600 hover:underline">
        ← Torna alla lista
      </a>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {asset.inventory_code}
            </h1>
            <p className="mt-2 text-gray-500">
              {item
                ? `${item.name}${item.brand ? ` - ${item.brand}` : ""}${item.model ? ` ${item.model}` : ""}`
                : "Gestione dettaglio asset e QR."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
            <img
              src={`http://localhost:8000/assets/${asset.inventory_code}/qr`}
              alt="QR Code"
              className="h-32 w-32"
            />

            <button
              onClick={handleMarkMissing}
              disabled={missingLoading || asset.status === "MANCANTE"}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {missingLoading ? "Aggiorno..." : "Segna come mancante"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">ID</p>
            <p className="mt-1 font-semibold">{asset.id}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Stato</p>
            <p className="mt-1 font-semibold">{asset.status}</p>
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

        <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
          <h2 className="mb-4 text-xl font-bold">
            Scheda tecnica item
          </h2>

          {!item ? (
            <p className="text-gray-500">
              Nessuna informazione item collegata a questo asset.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Nome oggetto</p>
                <p className="mt-1 font-semibold">{item.name}</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="mt-1 font-semibold">{item.category?.name ?? "-"}</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Marca</p>
                <p className="mt-1 font-semibold">{item.brand ?? "-"}</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Modello</p>
                <p className="mt-1 font-semibold">{item.model ?? "-"}</p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm md:col-span-2">
                <p className="text-sm text-gray-500">Specifiche tecniche</p>
                <p className="mt-1 whitespace-pre-wrap font-semibold">
                  {item.technical_specs ?? "-"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
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

        <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
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

        <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
          <h2 className="mb-4 text-xl font-bold">Storico movimenti</h2>

          {history.length === 0 ? (
            <p className="text-gray-500">Nessun movimento registrato.</p>
          ) : (
            <div className="space-y-3">
              {history.map((movement) => (
                <div key={movement.id} className="rounded-xl bg-white p-4 shadow-sm">
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