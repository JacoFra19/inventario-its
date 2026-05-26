

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Category,
  Item,
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

  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editTechnicalSpecs, setEditTechnicalSpecs] = useState("");
  const [editSerialized, setEditSerialized] = useState(true);

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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Catalogo tecnico
            </p>
            <h1 className="text-4xl font-black text-gray-900">
              Gestione item
            </h1>
            <p className="mt-2 text-gray-500">
              Modifica categorie, specifiche tecniche e informazioni dei beni.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/assets"
              className="rounded-xl border px-5 py-3 font-semibold hover:bg-white"
            >
              Vai agli asset
            </a>
          </div>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow">
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
              <div className="rounded-2xl bg-gray-100 px-5 py-4 text-sm text-gray-700">
                {filteredItems.length} item nel catalogo
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left text-gray-600">
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
                    <tr key={item.id} className="border-t align-top">
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
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
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
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            (item.asset_count ?? 0) > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
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
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            SI
                          </span>
                        ) : (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            NO
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEdit}
                              className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
                            >
                              Annulla
                            </button>

                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="rounded-xl bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50"
                            >
                              {saving ? "Salvo..." : "Salva"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
                            >
                              Modifica
                            </button>

                            <button
                              onClick={() => handleDelete(item)}
                              disabled={(item.asset_count ?? 0) > 0 || deletingItemId === item.id}
                              className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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