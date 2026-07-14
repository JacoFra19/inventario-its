"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  commitImport,
  getImportTemplateUrl,
  previewImport,
  type ImportPreviewResponse,
  type ImportPreviewRow,
} from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import type { DataTableColumn } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SectionCard from "@/components/ui/SectionCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/StatusBadge";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.detail?.message) return parsed.detail.message;
      if (parsed.detail) return parsed.detail;
    } catch {}

    return error.message;
  }

  return fallback;
}

function rowStatusLabel(status: ImportPreviewRow["status"]) {
  if (status === "VALID") return "Valida";
  if (status === "WARNING") return "Warning";
  return "Errore";
}

export default function ImportsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canCommit = Boolean(selectedFile && preview?.can_commit);
  const summary = preview?.summary;

  async function handlePreview() {
    if (!selectedFile) {
      toast.error("Seleziona un file Excel da validare.");
      return;
    }

    setPreviewLoading(true);

    try {
      const result = await previewImport(selectedFile);
      setPreview(result);

      if (result.summary.error_rows > 0) {
        toast.error("Preview completata con errori bloccanti.");
      } else {
        toast.success("Preview import completata");
      }
    } catch (error) {
      console.error(error);
      setPreview(null);
      toast.error(errorMessage(error, "Errore durante la preview dell'import."));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommit() {
    if (!selectedFile || !preview?.can_commit) return;

    setCommitLoading(true);

    try {
      const result = await commitImport(selectedFile);
      toast.success(
        `Import completato: ${result.result.created_assets} asset, ${result.result.created_stockcards + result.result.updated_stockcards} stockcard`
      );
      setPreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Errore durante la conferma dell'import."));
    } finally {
      setCommitLoading(false);
      setConfirmOpen(false);
    }
  }

  const previewColumns = useMemo<DataTableColumn<ImportPreviewRow>[]>(
    () => [
      {
        key: "row",
        header: "Riga",
        render: (row) => row.row_number,
      },
      {
        key: "type",
        header: "Tipo",
        render: (row) => row.type,
      },
      {
        key: "description",
        header: "Descrizione",
        render: (row) => (
          <span className="font-semibold text-gray-950">{row.description}</span>
        ),
      },
      {
        key: "status",
        header: "Stato",
        render: (row) => (
          <StatusBadge status={row.status} label={rowStatusLabel(row.status)} />
        ),
      },
      {
        key: "message",
        header: "Messaggio",
        render: (row) => row.message,
      },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <ConfirmDialog
        open={confirmOpen}
        title="Confermare import Excel?"
        description="Verranno creati asset, item, stockcard e assegnatari previsti dalla preview. L'operazione non è distruttiva."
        confirmLabel={commitLoading ? "Import in corso..." : "Conferma import"}
        cancelLabel="Annulla"
        variant="default"
        onConfirm={handleCommit}
        onCancel={() => setConfirmOpen(false)}
      />

      <PageHeader
        eyebrow="Import dati"
        title="Import Excel"
        description="Carica un file Excel per popolare asset serializzati e stock consumabili."
        actions={
          <SecondaryButton href={getImportTemplateUrl()} className="px-4 py-2 text-sm">
            Scarica template
          </SecondaryButton>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Righe valide"
          value={summary?.valid_rows ?? 0}
          description="Righe importabili senza warning."
        />
        <StatCard
          title="Warning"
          value={summary?.warning_rows ?? 0}
          description="Righe importabili con note operative."
        />
        <StatCard
          title="Errori"
          value={summary?.error_rows ?? 0}
          description="Errori bloccanti da correggere."
        />
        <StatCard
          title="Asset previsti"
          value={summary?.asset_to_create ?? 0}
          description="Asset serializzati da creare."
        />
      </div>

      <SectionCard
        className="mb-8"
        title="File Excel"
        description="Il file deve contenere il foglio Import e le colonne del template."
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] ?? null);
              setPreview(null);
            }}
            className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm"
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton
              onClick={handlePreview}
              disabled={previewLoading || !selectedFile}
              className="px-4 py-2"
            >
              {previewLoading ? "Validazione..." : "Valida file"}
            </PrimaryButton>
            <PrimaryButton
              onClick={() => setConfirmOpen(true)}
              disabled={commitLoading || !canCommit}
              className="px-4 py-2"
            >
              Conferma import
            </PrimaryButton>
          </div>
        </div>

        {selectedFile && (
          <p className="mt-3 text-sm text-gray-500">
            File selezionato: {selectedFile.name}
          </p>
        )}

        {preview && (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <p className="text-sm text-gray-500">Item</p>
              <p className="mt-1 font-semibold">
                {preview.summary.items_to_create} da creare, {preview.summary.items_to_reuse} riusati
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <p className="text-sm text-gray-500">Stockcard</p>
              <p className="mt-1 font-semibold">
                {preview.summary.stockcard_to_create} nuove, {preview.summary.stockcard_to_update} aggiornate
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <p className="text-sm text-gray-500">Assegnatari</p>
              <p className="mt-1 font-semibold">
                {preview.summary.assignee_to_create} da creare, {preview.summary.assignee_to_reuse} riusati
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Preview validazione" description="Risultato riga per riga">
        <DataTable
          columns={previewColumns}
          rows={preview?.rows ?? []}
          getRowKey={(row) => row.row_number}
          emptyMessage="Carica un file Excel e avvia la validazione."
          loading={previewLoading}
          loadingMessage="Validazione file in corso..."
        />
      </SectionCard>
    </main>
  );
}
