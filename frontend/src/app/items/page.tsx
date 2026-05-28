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
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import DangerButton from "@/components/ui/DangerButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { toast } from "sonner";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
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

  function itemHasLinkedRecords(item: Item) {
    return (item.asset_count ?? 0) > 0 || (item.stock_card_count ?? 0) > 0;
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
      toast.success("Item creato correttamente");
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
      toast.success("Item aggiornato correttamente");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(item: Item) {
    if (itemHasLinkedRecords(item)) {
      toast.error(
        "Non puoi eliminare questo item perché ha asset o stockcard collegati."
      );
      return;
    }

    setItemToDelete(item);
  }

  function closeDeleteDialog() {
    setItemToDelete(null);
  }

  function errorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as { detail?: string };
        if (parsed.detail) return parsed.detail;
      } catch {}

      return error.message;
    }

    return fallback;
  }

  async function confirmDeleteItem() {
    if (!itemToDelete) return;

    setDeletingItemId(itemToDelete.id);

    try {
      await deleteItem(itemToDelete.id);
      await loadData();
      toast.success("Item eliminato correttamente");
    } catch (error) {
      const message = errorMessage(
        error,
        "Errore durante l'eliminazione dell'item."
      );
      console.error(message);
      toast.error(message);
      return;
    } finally {
      setDeletingItemId(null);
      closeDeleteDialog();
    }
  }

  const itemColumns: DataTableColumn<Item>[] = [
    {
      key: "name",
      header: "Nome",
      render: (item) => {
        const isEditing = editingItemId === item.id;

        return isEditing ? (
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
        );
      },
    },
    {
      key: "category",
      header: "Categoria",
      render: (item) => {
        const isEditing = editingItemId === item.id;

        return isEditing ? (
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
        );
      },
    },
    {
      key: "brand",
      header: "Marca",
      render: (item) => {
        const isEditing = editingItemId === item.id;

        return isEditing ? (
          <input
            className="w-full rounded-xl border p-2"
            value={editBrand}
            onChange={(e) => setEditBrand(e.target.value)}
          />
        ) : (
          item.brand ?? "-"
        );
      },
    },
    {
      key: "model",
      header: "Modello",
      render: (item) => {
        const isEditing = editingItemId === item.id;

        return isEditing ? (
          <input
            className="w-full rounded-xl border p-2"
            value={editModel}
            onChange={(e) => setEditModel(e.target.value)}
          />
        ) : (
          item.model ?? "-"
        );
      },
    },
    {
      key: "asset_count",
      header: "Asset collegati",
      render: (item) => (
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            (item.asset_count ?? 0) > 0
              ? "border-blue-200 bg-blue-100 text-blue-700"
              : "border-gray-200 bg-gray-100 text-gray-600"
          }`}
        >
          {item.asset_count ?? 0}
        </span>
      ),
    },
    {
      key: "serialized",
      header: "Serializzato",
      render: (item) => {
        const isEditing = editingItemId === item.id;

        return isEditing ? (
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
        );
      },
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ConfirmDialog
        open={itemToDelete !== null}
        title="Eliminare item?"
        description="Questa operazione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={confirmDeleteItem}
        onCancel={closeDeleteDialog}
      />

      <div className="mx-auto max-w-7xl">
        <PageHeader
          backHref="/"
          backLabel="Dashboard"
          eyebrow="Catalogo tecnico"
          title="Gestione item"
          description="Modifica categorie, specifiche tecniche e informazioni dei beni."
          actions={
            <SecondaryButton href="/assets">
              Vai agli asset
            </SecondaryButton>
          }
        />

        <SectionCard
          className="mb-6"
          title="Nuovo item"
          description="Crea una nuova tipologia bene da usare nella gestione degli asset fisici e degli stock."
        >

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

            <PrimaryButton
              type="submit"
              disabled={creatingItem || !newItemName || !newItemCategoryId}
              className="md:col-span-4"
            >
              {creatingItem ? "Creo..." : "Crea item"}
            </PrimaryButton>
          </form>
        </SectionCard>

        <SectionCard className="mb-6">
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
        </SectionCard>

        <DataTable
          columns={itemColumns}
          rows={filteredItems}
          getRowKey={(item) => item.id}
          emptyMessage="Nessun item trovato con i filtri selezionati."
          actions={{
            header: "Azioni",
            render: (item) => {
              const isEditing = editingItemId === item.id;

              return isEditing ? (
                <div className="flex justify-end gap-2">
                  <SecondaryButton onClick={cancelEdit} className="px-4 py-2">
                    Annulla
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2"
                  >
                    {saving ? "Salvo..." : "Salva"}
                  </PrimaryButton>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <SecondaryButton
                    onClick={() => startEdit(item)}
                    className="px-4 py-2"
                  >
                    Modifica
                  </SecondaryButton>
                  <DangerButton
                    onClick={() => handleDelete(item)}
                    disabled={itemHasLinkedRecords(item) || deletingItemId === item.id}
                    className="px-4 py-2"
                  >
                    {deletingItemId === item.id ? "Elimino..." : "Elimina"}
                  </DangerButton>
                </div>
              );
            },
          }}
        />
      </div>
    </main>
  );
}
