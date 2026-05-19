"use client";

import { useEffect, useState } from "react";
import { getAssetHistory, transferAsset, type AssetMovement } from "@/lib/api";

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
  const [history, setHistory] = useState<AssetMovement[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { code } = await params;

      const [assetRes, locationsRes] = await Promise.all([
        fetch(`http://localhost:8000/assets/${code}`, {
          cache: "no-store",
        }),
        fetch(`http://localhost:8000/locations`, {
          cache: "no-store",
        }),
      ]);

      if (!assetRes.ok) return;

      const assetData = await assetRes.json();
      const locationsData = await locationsRes.json();

      setAsset(assetData);
      setLocations(locationsData);

      const historyData = await getAssetHistory(assetData.id);
      setHistory(historyData);
    }

    load();
  }, [params]);

  async function handleTransfer() {
    if (!asset || !selectedLocation) return;

    setLoading(true);

    try {
      await transferAsset({
        assetId: asset.id,
        toLocationCode: selectedLocation,
      });

      const refreshed = await fetch(
        `http://localhost:8000/assets/${asset.inventory_code}`,
        {
          cache: "no-store",
        }
      );

      if (!refreshed.ok) {
        throw new Error("Errore nel refresh dell'asset dopo il trasferimento");
      }

      const refreshedAsset = await refreshed.json();
      setAsset(refreshedAsset);
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

  function locationName(id: number | null) {
    if (id === null) return "Sede iniziale non registrata";

    const location = locations.find((l) => l.id === id);
    return location ? `${location.code} - ${location.name}` : `Sede ID ${id}`;
  }

  function currentLocationName() {
    return locationName(asset?.current_location_id ?? null);
  }

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
              Gestione dettaglio asset e QR.
            </p>
          </div>

          <img
            src={`http://localhost:8000/assets/${asset.inventory_code}/qr`}
            alt="QR Code"
            className="h-32 w-32"
          />
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