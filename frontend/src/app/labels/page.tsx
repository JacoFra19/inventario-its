"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Asset, getAssets } from "@/lib/api";

export default function LabelsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAssets();
        setAssets(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function toggleAsset(id: number) {
    setSelectedAssets((prev) =>
      prev.includes(id)
        ? prev.filter((assetId) => assetId !== id)
        : [...prev, id]
    );
  }

  const printableAssets = assets.filter((asset) =>
    selectedAssets.includes(asset.id)
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8 print:bg-white">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between print:hidden">
        <div>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Etichette QR
          </h1>

          <p className="text-gray-600">
            Seleziona gli asset e stampa le etichette inventariali.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          disabled={printableAssets.length === 0}
          className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white shadow hover:bg-black disabled:opacity-50"
        >
          Stampa etichette
        </button>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow print:hidden">
        <h2 className="mb-4 text-xl font-bold">
          Selezione asset
        </h2>

        {loading ? (
          <p className="text-gray-500">Caricamento asset...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <label
                key={asset.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedAssets.includes(asset.id)}
                  onChange={() => toggleAsset(asset.id)}
                />

                <div>
                  <p className="font-mono font-semibold">
                    {asset.inventory_code}
                  </p>
                  <p className="text-sm text-gray-500">
                    {asset.status}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
        {printableAssets.map((asset) => (
          <div
            key={asset.id}
            className="flex break-inside-avoid flex-col items-center rounded-2xl border bg-white p-4 shadow print:shadow-none"
          >
            <img
              src={`http://localhost:8000/assets/${asset.inventory_code}/qr`}
              alt={`QR ${asset.inventory_code}`}
              className="h-36 w-36"
            />

            <p className="mt-3 text-center font-mono text-sm font-bold">
              {asset.inventory_code}
            </p>

            <p className="mt-1 text-center text-xs text-gray-500">
              Inventario ITS
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
