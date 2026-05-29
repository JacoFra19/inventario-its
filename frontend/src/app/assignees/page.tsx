"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createAssignee,
  deleteAssignee,
  getAssignee,
  getAssignees,
  updateAssignee,
  type Assignee,
  type AssigneeType,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";
import DangerButton from "@/components/ui/DangerButton";
import PageHeader from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SectionCard from "@/components/ui/SectionCard";

type AssigneeForm = {
  name: string;
  type: AssigneeType;
  email: string;
  phone: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: AssigneeForm = {
  name: "",
  type: "PERSON",
  email: "",
  phone: "",
  notes: "",
  isActive: true,
};

function assigneeTypeLabel(type: AssigneeType) {
  if (type === "PERSON") return "Persona";
  if (type === "DEPARTMENT") return "Reparto";
  return "Altro";
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.detail) return parsed.detail;
    } catch {}

    return error.message;
  }

  return fallback;
}

export default function AssigneesPage() {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [expandedAssignee, setExpandedAssignee] = useState<Assignee | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<AssigneeForm>(emptyForm);
  const [editingAssigneeId, setEditingAssigneeId] = useState<number | null>(null);
  const [assigneeToDelete, setAssigneeToDelete] = useState<Assignee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadAssignees() {
    setLoading(true);

    try {
      const data = await getAssignees();
      setAssignees(data);
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il recupero degli assegnatari.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignees();
  }, []);

  const filteredAssignees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return assignees;

    return assignees.filter((assignee) =>
      [
        assignee.name,
        assignee.type,
        assignee.email,
        assignee.phone,
        assignee.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [assignees, query]);

  function resetForm() {
    setForm(emptyForm);
    setEditingAssigneeId(null);
  }

  function startEdit(assignee: Assignee) {
    setEditingAssigneeId(assignee.id);
    setForm({
      name: assignee.name,
      type: assignee.type,
      email: assignee.email ?? "",
      phone: assignee.phone ?? "",
      notes: assignee.notes ?? "",
      isActive: assignee.is_active,
    });
  }

  async function toggleDetail(assignee: Assignee) {
    if (expandedAssignee?.id === assignee.id) {
      setExpandedAssignee(null);
      return;
    }

    setDetailLoading(true);

    try {
      const detail = await getAssignee(assignee.id);
      setExpandedAssignee(detail);
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il recupero del dettaglio assegnatario.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nome assegnatario obbligatorio.");
      return;
    }

    setSaving(true);

    try {
      if (editingAssigneeId) {
        await updateAssignee({
          assigneeId: editingAssigneeId,
          name: form.name.trim(),
          type: form.type,
          email: form.email.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim(),
          isActive: form.isActive,
        });
        toast.success("Assegnatario aggiornato correttamente");
      } else {
        await createAssignee({
          name: form.name.trim(),
          type: form.type,
          email: form.email.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim(),
          isActive: form.isActive,
        });
        toast.success("Assegnatario creato correttamente");
      }

      resetForm();
      await loadAssignees();
      if (expandedAssignee) {
        const detail = await getAssignee(expandedAssignee.id);
        setExpandedAssignee(detail);
      }
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Errore durante il salvataggio dell'assegnatario."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteAssignee() {
    if (!assigneeToDelete) return;

    try {
      const result = await deleteAssignee(assigneeToDelete.id);

      if (result.deactivated) {
        toast.success("Assegnatario disattivato perché collegato ad asset");
      } else {
        toast.success("Assegnatario eliminato correttamente");
      }

      if (expandedAssignee?.id === assigneeToDelete.id) {
        setExpandedAssignee(null);
      }

      await loadAssignees();
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Errore durante l'eliminazione dell'assegnatario."));
    } finally {
      setAssigneeToDelete(null);
    }
  }

  const assigneeColumns: DataTableColumn<Assignee>[] = [
    {
      key: "name",
      header: "Nome",
      render: (assignee) => (
        <div>
          <p className="font-semibold text-gray-950">{assignee.name}</p>
          <p className="mt-1 text-xs text-gray-500">
            Creato il {new Date(assignee.created_at).toLocaleDateString("it-IT")}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (assignee) => (
        <StatusBadge status={assignee.type} label={assigneeTypeLabel(assignee.type)} />
      ),
    },
    {
      key: "contacts",
      header: "Contatti",
      render: (assignee) => (
        <div className="text-sm text-gray-600">
          <p>{assignee.email ?? "-"}</p>
          <p>{assignee.phone ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "assets",
      header: "Asset",
      render: (assignee) => (
        <span className="font-semibold">{assignee.asset_count ?? 0}</span>
      ),
    },
    {
      key: "status",
      header: "Stato",
      render: (assignee) => (
        <StatusBadge
          status={assignee.is_active ? "ATTIVO" : "DISATTIVATO"}
          label={assignee.is_active ? "Attivo" : "Disattivato"}
        />
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ConfirmDialog
        open={assigneeToDelete !== null}
        title="Eliminare assegnatario?"
        description="Se l'assegnatario ha asset collegati verrà disattivato invece di essere eliminato."
        confirmLabel="Conferma"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={confirmDeleteAssignee}
        onCancel={() => setAssigneeToDelete(null)}
      />

      <PageHeader
        eyebrow="Anagrafica"
        title="Assegnatari"
        description="Gestisci persone, reparti o riferimenti a cui assegnare asset inventariali."
        backHref="/"
        backLabel="Dashboard"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-5">
          <SectionCard title="Lista assegnatari" description="Ricerca e gestione anagrafica">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca nome, tipo, email, telefono..."
              className="mb-5 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
            />

            <DataTable
              columns={assigneeColumns}
              rows={filteredAssignees}
              getRowKey={(assignee) => assignee.id}
              loading={loading}
              loadingMessage="Caricamento assegnatari..."
              emptyMessage="Nessun assegnatario trovato."
              actions={{
                render: (assignee) => (
                  <div className="flex flex-wrap justify-end gap-2">
                    <SecondaryButton
                      onClick={() => toggleDetail(assignee)}
                      className="px-3 py-2 text-sm"
                    >
                      {expandedAssignee?.id === assignee.id ? "Chiudi" : "Dettaglio"}
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() => startEdit(assignee)}
                      className="px-3 py-2 text-sm"
                    >
                      Modifica
                    </SecondaryButton>
                    <DangerButton
                      onClick={() => setAssigneeToDelete(assignee)}
                      className="px-3 py-2 text-sm"
                    >
                      Elimina
                    </DangerButton>
                  </div>
                ),
              }}
            />
          </SectionCard>

          {expandedAssignee && (
            <SectionCard
              title={`Asset assegnati a ${expandedAssignee.name}`}
              description="Asset attualmente collegati all'assegnatario"
              actions={
                <StatusBadge
                  status={expandedAssignee.is_active ? "ATTIVO" : "DISATTIVATO"}
                  label={expandedAssignee.is_active ? "Attivo" : "Disattivato"}
                />
              }
            >
              {detailLoading ? (
                <p className="text-gray-500">Caricamento dettaglio...</p>
              ) : !expandedAssignee.assets || expandedAssignee.assets.length === 0 ? (
                <p className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-medium text-gray-600">
                  Nessun asset attualmente assegnato.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {expandedAssignee.assets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.inventory_code}`}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-950">
                            {asset.inventory_code}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {asset.notes ?? "Nessuna nota"}
                          </p>
                        </div>
                        <StatusBadge status={asset.status} size="sm" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </section>

        <SectionCard
          title={editingAssigneeId ? "Modifica assegnatario" : "Nuovo assegnatario"}
          description="Anagrafica usata per assegnare asset"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Nome</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="Nome persona, reparto o riferimento"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Tipo</span>
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as AssigneeType })}
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="PERSON">Persona</option>
                <option value="DEPARTMENT">Reparto</option>
                <option value="OTHER">Altro</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Email</span>
              <input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="email opzionale"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Telefono</span>
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="telefono opzionale"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Note</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="mt-2 min-h-24 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                placeholder="note opzionali"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="h-4 w-4"
              />
              Assegnatario attivo
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton type="submit" disabled={saving} className="px-4 py-2">
                {saving ? "Salvataggio..." : editingAssigneeId ? "Aggiorna" : "Crea"}
              </PrimaryButton>
              {editingAssigneeId && (
                <SecondaryButton onClick={resetForm} className="px-4 py-2">
                  Annulla modifica
                </SecondaryButton>
              )}
            </div>
          </form>
        </SectionCard>
      </div>
    </main>
  );
}
