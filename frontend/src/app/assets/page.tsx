"use client";

import { useEffect, useState } from "react";
import {
  Asset,
  Item,
  Location,
  createAsset,
  createItem,
  getAssets,
  getItems,
  getLocations,
} from "@/lib/api";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [itemId, setItemId] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemSerialized, setNewItemSerialized] = useState(true);
  const [creatingItem, setCreatingItem] = useState(false);

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

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName || !newItemCategory) return;

    setCreatingItem(true);

    try {
      await createItem({
        name: newItemName,
        category: newItemCategory,
        isSerialized: newItemSerialized,
      });

      setNewItemName("");
      setNewItemCategory("");
      setNewItemSerialized(true);
      await loadData();
    } finally {
      setCreatingItem(false);
    }
  }

  function locationLabel(id: number) {
    const location = locations.find((l) => l.id === id);
    return location ? `${location.code} - ${location.name}` : id;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <a href="/" className="text-blue-600 hover:underline">
          ← Dashboard
        </a>

        <h1 className="mt-4 text-3xl font-bold">Asset</h1>
        <p className="text-gray-600">
          Gestione beni inventariati, codici univoci e QR.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Asset totali</p>
          <p className="text-3xl font-bold">{assets.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">In sede</p>
          <p className="text-3xl font-bold">
            {assets.filter((a) => a.status === "IN_SEDE").length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Assegnati</p>
          <p className="text-3xl font-bold">
            {assets.filter((a) => a.status === "ASSEGNATO").length}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Nuovo item</h2>

        <form onSubmit={handleCreateItem} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            className="rounded-xl border p-3"
            placeholder="Nome item"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />

          <input
            className="rounded-xl border p-3"
            placeholder="Categoria"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
          />

          <label className="flex items-center gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={newItemSerialized}
              onChange={(e) => setNewItemSerialized(e.target.checked)}
            />
            Serializzato
          </label>

          <button
            type="submit"
            disabled={creatingItem}
            className="rounded-xl bg-gray-900 p-3 font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {creatingItem ? "Creo..." : "Crea item"}
          </button>
        </form>
      </section>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Nuovo asset</h2>

        <form onSubmit={handleCreateAsset} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select
            className="rounded-xl border p-3"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">Seleziona item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
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
            {assets.map((asset) => (
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
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
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