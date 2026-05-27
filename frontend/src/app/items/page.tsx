"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Category,
  Item,
  createItem,
  deleteItem,
  getCategories,
  getItems,
  updateItem,
} from "@/lib/api";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);

  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editTechnicalSpecs, setEditTechnicalSpecs] = useState("");
  const [editSerialized, setEditSerialized] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategoryId, setNewItemCategoryId] = useState("");
  const [newItemBrand, setNewItemBrand] = useState("");
  const [newItemModel, setNewItemModel] = useState("");
  const [newItemTechnicalSpecs, setNewItemTechnicalSpecs] = useState("");
  const [newItemSerialized, setNewItemSerialized] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [itemsData, categoriesData] = await Promise.all([
      getItems(),
      getCategories(),
    ]);

    setItems(itemsData);
    setCategories(categoriesData);
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = [
        item.name,
        item.category?.name ?? "",
        item.brand ?? "",
        item.model ?? "",
        item.technical_specs ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  function startEdit(item: Item) {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditCategoryId(String(item.category_id));
    setEditBrand(item.brand ?? "");
    setEditModel(item.model ?? "");
    setEditTechnicalSpecs(item.technical_specs ?? "");
    setEditSerialized(item.is_serialized);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setEditName("");
    setEditCategoryId("");
    setEditBrand("");
    setEditModel("");
    setEditTechnicalSpecs("");
    setEditSerialized(true);
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName || !newItemCategoryId) return;

    setCreatingItem(true);

    try {
      await createItem({
        name: newItemName,
        categoryId: Number(newItemCategoryId),
        brand: newItemBrand,
        model: newItemModel,
        technicalSpecs: newItemTechnicalSpecs,
        isSerialized: newItemSerialized,
      });

      setNewItemName("");
      setNewItemCategoryId("");
      setNewItemBrand("");
      setNewItemModel("");
      setNewItemTechnicalSpecs("");
      setNewItemSerialized(true);
      await loadData();
    } finally {
      setCreatingItem(false);
    }
  }

  async function handleSave() {
    if (!editingItemId || !editName || !editCategoryId) return;

    setSaving(true);

    try {
      await updateItem({
        itemId: editingItemId,
        name: editName,
        categoryId: Number(editCategoryId),
        brand: editBrand,
        model: editModel,
        technicalSpecs: editTechnicalSpecs,
        isSerialized: editSerialized,
      });

      await loadData();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Item) {
    const assetCount = item.asset_count ?? 0;

    if (assetCount > 0) {
      alert("Non puoi eliminare questo item perché ha asset collegati.");
      return;
    }

    const confirmed = window.confirm(
      `Vuoi eliminare definitivamente l'item "${item.name}"?`
    );

    if (!confirmed) return;

    setDeletingItemId(item.id);

    try {
      await deleteItem(item.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Errore durante l'eliminazione dell'item.");
    } finally {
      setDeletingItemId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-gray-100 transition hover:bg-blue-50"
            >
              ← Dashboard
            </a>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Catalogo tecnico
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Gestione item
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Modifica categorie, specifiche tecniche e informazioni dei beni.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/assets"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-gray-900 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50"
            >
              Vai agli asset
            </a>
          </div>
        </div>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow ring-1 ring-gray-100 md:p-6">
          <h2 className="mb-4 text-xl font-bold">Nuovo item</h2>
          <p className="mb-5 max-w-2xl text-sm text-gray-500">
            Crea una nuova tipologia bene da usare nella gestione degli asset fisici e degli stock.
          </p>

          <form onSubmit={handleCreateItem} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              className="rounded-xl border p-3"
              placeholder="Nome item, es. MacBook Pro 14"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />

            <select
              className="rounded-xl border p-3"
              value={newItemCategoryId}
              onChange={(e) => setNewItemCategoryId(e.target.value)}
            >
              <option value="">Seleziona categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              className="rounded-xl border p-3"
              placeholder="Marca, es. Apple"
              value={newItemBrand}
              onChange={(e) => setNewItemBrand(e.target.value)}
            />

            <input
              className="rounded-xl border p-3"
              placeholder="Modello, es. M4 Pro"
              value={newItemModel}
              onChange={(e) => setNewItemModel(e.target.value)}
            />

            <textarea
              className="rounded-xl border p-3 md:col-span-3"
              placeholder="Specifiche tecniche, es. 24GB RAM, 1TB SSD, CPU 12-core..."
              value={newItemTechnicalSpecs}
              onChange={(e) => setNewItemTechnicalSpecs(e.target.value)}
              rows={3}
            />

            <label className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3 ring-1 ring-gray-100 md:col-span-1">
              <input
                type="checkbox"
                checked={newItemSerialized}
                onChange={(e) => setNewItemSerialized(e.target.checked)}
              />
              Serializzato
            </label>

            <button
              type="submit"
              disabled={creatingItem || !newItemName || !newItemCategoryId}
              className="rounded-xl bg-gray-900 p-3 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50 md:col-span-4"
            >
              {creatingItem ? "Creo..." : "Crea item"}
            </button>
          </form>
        </section>

        <section className="mb-6 rounded-3xl bg-white p-5 shadow ring-1 ring-gray-100 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-600">
                Ricerca item
              </label>

              <input
                className="w-full rounded-xl border p-3 shadow-sm"
                placeholder="Nome, categoria, marca, modello..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <div className="rounded-2xl bg-gray-50 px-5 py-4 text-sm text-gray-700 ring-1 ring-gray-100">
                {filteredItems.length} item nel catalogo
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow ring-1 ring-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100/95 text-left text-xs uppercase tracking-wide text-gray-500 backdrop-blur">
                <tr>
                  <th className="p-4 font-semibold">Nome</th>
                  <th className="p-4 font-semibold">Categoria</th>
                  <th className="p-4 font-semibold">Marca</th>
                  <th className="p-4 font-semibold">Modello</th>
                  <th className="p-4 font-semibold">Asset collegati</th>
                  <th className="p-4 font-semibold">Serializzato</th>
                  <th className="p-4 font-semibold text-right">Azioni</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => {
                  const isEditing = editingItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="group border-t align-top transition hover:bg-blue-50/40"
                    >
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            className="w-full rounded-xl border p-2"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>

                            {item.technical_specs && (
                              <p className="mt-1 whitespace-pre-wrap text-xs text-gray-500">
                                {item.technical_specs}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <select
                            className="w-full rounded-xl border p-2"
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {item.category?.name ?? "-"}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <input
                            className="w-full rounded-xl border p-2"
                            value={editBrand}
                            onChange={(e) => setEditBrand(e.target.value)}
                          />
                        ) : (
                          item.brand ?? "-"
                        )}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <input
                            className="w-full rounded-xl border p-2"
                            value={editModel}
                            onChange={(e) => setEditModel(e.target.value)}
                          />
                        ) : (
                          item.model ?? "-"
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            (item.asset_count ?? 0) > 0
                              ? "border-blue-200 bg-blue-100 text-blue-700"
                              : "border-gray-200 bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.asset_count ?? 0}
                        </span>
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editSerialized}
                              onChange={(e) =>
                                setEditSerialized(e.target.checked)
                              }
                            />
                            Serializzato
                          </label>
                        ) : item.is_serialized ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            SI
                          </span>
                        ) : (
                          <span className="rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            NO
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="rounded-xl bg-white px-4 py-2 font-semibold shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50"
                            >
                              Annulla
                            </button>

                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="rounded-xl bg-gray-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
                            >
                              {saving ? "Salvo..." : "Salva"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded-xl bg-white px-4 py-2 font-semibold shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50"
                            >
                              Modifica
                            </button>

                            <button
                              onClick={() => handleDelete(item)}
                              disabled={(item.asset_count ?? 0) > 0 || deletingItemId === item.id}
                              className="rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingItemId === item.id ? "Elimino..." : "Elimina"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}