import Link from "next/link";
import {
  getAlerts,
  getAssets,
  getEvent,
  getEvents,
  getItems,
  getStocks,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import SecondaryButton from "@/components/ui/SecondaryButton";

export default async function Home() {
  const [assets, stocks, events, items, alerts] = await Promise.all([
    getAssets(),
    getStocks(),
    getEvents(),
    getItems(),
    getAlerts(),
  ]);

  const inSede = assets.filter((asset) => asset.status === "IN_SEDE").length;
  const assegnati = assets.filter((asset) => asset.status === "ASSEGNATO").length;
  const percentualeInSede = assets.length > 0 ? Math.round((inSede / assets.length) * 100) : 0;
  const stockSottoSoglia = stocks.filter(
    (stock) => stock.quantity <= stock.min_threshold
  ).length;

  const assetInEvento = assets.filter(
    (asset) => asset.status === "IN_EVENTO"
  ).length;

  const assetMancanti = assets.filter(
    (asset) => asset.status === "MANCANTE"
  ).length;

  const eventiAperti = events.filter(
    (event) => event.status === "OPEN"
  ).length;

  const eventiChiusi = events.filter(
    (event) => event.status === "CLOSED"
  ).length;

  const eventiAnnullati = events.filter(
    (event) => event.status === "CANCELLED"
  ).length;

  const hasAlerts =
    stockSottoSoglia > 0 ||
    assetInEvento > 0 ||
    assetMancanti > 0 ||
    eventiAperti > 0;

  const latestEvents = events.slice(0, 4);
  const latestEventDetails = await Promise.all(
    latestEvents.map((event) => getEvent(event.id))
  );

  const totalAlerts = alerts.critical.length + alerts.warning.length;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <section className="mb-8 overflow-hidden rounded-3xl bg-gray-900 p-6 text-white shadow ring-1 ring-gray-800 md:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-300">
          Web App Inventario
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Inventario ITS
        </h1>
        <p className="mt-3 max-w-2xl text-gray-300">
          Dashboard operativa per la gestione di asset, sedi, assegnazioni,
          trasferimenti e QR inventariali.
        </p>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Item a catalogo"
          value={items.length}
          description="Tipologie bene disponibili per creare asset e stock."
        />

        <StatCard
          title="Asset fisici"
          value={assets.length}
          description={`${percentualeInSede}% attualmente in sede.`}
        />

        <StatCard
          title="Eventi totali"
          value={events.length}
          description={`${eventiAperti} aperti, ${eventiChiusi} chiusi, ${eventiAnnullati} annullati.`}
        />

        <StatCard
          title="Stock monitorati"
          value={stocks.length}
          description={`${stockSottoSoglia} sotto soglia minima.`}
        />
      </section>

      <SectionCard
        className="mb-8"
        title="Alert Operativi"
        description="Situazioni che richiedono verifica o attenzione logistica."
        actions={
          <StatusBadge
            status={alerts.critical.length > 0 ? "MANCANTE" : totalAlerts > 0 ? "WARNING" : "IN_SEDE"}
            label={
              alerts.critical.length > 0
                ? `${alerts.critical.length} critici`
                : totalAlerts > 0
                  ? `${totalAlerts} warning`
                  : "Nessun alert"
            }
          />
        }
      >
        {totalAlerts === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-medium text-emerald-800">
            Nessun alert operativo presente.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {alerts.critical.map((alert, index) => (
              <Link
                key={`critical-${alert.type}-${index}`}
                href={typeof alert.references.href === "string" ? alert.references.href : "#"}
                className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                      {alert.type}
                    </p>
                    <p className="mt-2 font-semibold text-red-950">
                      {alert.message}
                    </p>
                  </div>

                  <StatusBadge status="MANCANTE" label="Critico" size="sm" />
                </div>
              </Link>
            ))}

            {alerts.warning.map((alert, index) => (
              <Link
                key={`warning-${alert.type}-${index}`}
                href={typeof alert.references.href === "string" ? alert.references.href : "#"}
                className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                      {alert.type}
                    </p>
                    <p className="mt-2 font-semibold text-orange-950">
                      {alert.message}
                    </p>
                  </div>

                  <StatusBadge status="WARNING" label="Warning" size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        className="mb-8"
        title="Ultime movimentazioni logistiche"
        description="Eventi recenti"
        actions={
          <SecondaryButton href="/events" className="px-4 py-2 text-sm text-blue-700 hover:bg-blue-50">
            Vai agli eventi →
          </SecondaryButton>
        }
      >

        {latestEventDetails.length === 0 ? (
          <p className="mt-5 text-gray-500">
            Nessun evento presente.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {latestEventDetails.map((detail) => {
              const openAssets = detail.assets.filter(
                (eventAsset) => eventAsset.status === "OUT"
              ).length;

              const missingAssets = detail.assets.filter(
                (eventAsset) => eventAsset.status === "MISSING"
              ).length;

              const stockToReturn = detail.stocks.reduce(
                (total, eventStock) =>
                  total + Math.max(0, eventStock.quantity_out - eventStock.quantity_returned),
                0
              );

              const needsAttention =
                detail.event.status === "OPEN" &&
                (openAssets > 0 || stockToReturn > 0 || missingAssets > 0);

              return (
                <Link
                  key={detail.event.id}
                  href={`/events?eventId=${detail.event.id}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{detail.event.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {detail.event.location ?? "Luogo non indicato"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {detail.event.start_date ?? "Data non indicata"} → {detail.event.end_date ?? "Data non indicata"}
                      </p>
                    </div>

                    <StatusBadge status={detail.event.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100">
                      <p className="text-xs text-gray-500">Asset fuori</p>
                      <p className="mt-1 text-xl font-bold">{openAssets}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100">
                      <p className="text-xs text-gray-500">Stock da rientrare</p>
                      <p className="mt-1 text-xl font-bold">{stockToReturn}</p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100">
                      <p className="text-xs text-gray-500">Mancanti</p>
                      <p className="mt-1 text-xl font-bold">{missingAssets}</p>
                    </div>
                  </div>

                  {needsAttention && (
                    <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm font-medium text-yellow-800">
                      Materiale ancora da verificare prima della chiusura.
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        className="mb-8"
        title="Stato inventario fisico"
        description="Distribuzione asset"
        actions={
          <SecondaryButton href="/assets" className="px-4 py-2 text-sm text-blue-700 hover:bg-blue-50">
            Vai agli asset →
          </SecondaryButton>
        }
      >
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Link href="/assets?status=IN_SEDE" className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">In sede</p>
              <StatusBadge status="IN_SEDE" />
            </div>
            <p className="mt-3 text-2xl font-bold">{inSede}</p>
          </Link>

          <Link href="/assets?status=ASSEGNATO" className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">Assegnati</p>
              <StatusBadge status="ASSEGNATO" />
            </div>
            <p className="mt-3 text-2xl font-bold">{assegnati}</p>
          </Link>

          <Link href="/assets?status=IN_EVENTO" className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">In evento</p>
              <StatusBadge status="IN_EVENTO" />
            </div>
            <p className="mt-3 text-2xl font-bold">{assetInEvento}</p>
          </Link>

          <Link href="/assets?status=MANCANTE" className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">Mancanti</p>
              <StatusBadge status="MANCANTE" />
            </div>
            <p className="mt-3 text-2xl font-bold">{assetMancanti}</p>
          </Link>
        </div>
      </SectionCard>

      <SectionCard
        className="mb-8"
        title="Situazione da monitorare"
        description="Alert operativi"
        actions={
          <StatusBadge
            status={hasAlerts ? "MANCANTE" : "IN_SEDE"}
            label={hasAlerts ? "Richiede attenzione" : "Tutto regolare"}
          />
        }
      >
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Link
            href="/stocks?lowStock=1"
            className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Stock sotto soglia</p>
            <p className="mt-1 text-2xl font-bold">{stockSottoSoglia}</p>
          </Link>

          <Link
            href="/events?status=OPEN"
            className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Eventi aperti</p>
            <p className="mt-1 text-2xl font-bold">{eventiAperti}</p>
          </Link>

          <Link
            href="/assets?status=IN_EVENTO"
            className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Asset in evento</p>
            <p className="mt-1 text-2xl font-bold">{assetInEvento}</p>
          </Link>

          <Link
            href="/assets?status=MANCANTE"
            className="rounded-2xl border border-gray-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
          >
            <p className="text-sm text-gray-500">Asset mancanti</p>
            <p className="mt-1 text-2xl font-bold">{assetMancanti}</p>
          </Link>
        </div>
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Link
          href="/assets"
          className="rounded-3xl bg-blue-600 p-6 text-white shadow ring-1 ring-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-blue-100">
            Asset serializzati
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gestisci Asset</h2>
          <p className="mt-2 text-blue-100">
            Consulta, crea, trasferisci e assegna i beni inventariati.
          </p>
        </Link>

        <Link
          href="/items"
          className="rounded-3xl bg-indigo-600 p-6 text-white shadow ring-1 ring-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-indigo-100">
            Catalogo tecnico
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gestisci Item</h2>
          <p className="mt-2 text-indigo-100">
            Crea, modifica e pulisci le tipologie bene usate dagli asset.
          </p>
        </Link>

        <Link
          href="/scan"
          className="rounded-3xl bg-gray-900 p-6 text-white shadow ring-1 ring-gray-800 transition hover:-translate-y-0.5 hover:bg-black hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-gray-300">
            Scanner mobile
          </p>
          <h2 className="mt-2 text-2xl font-bold">Apri Scanner QR</h2>
          <p className="mt-2 text-gray-300">
            Scansiona rapidamente i QR code degli asset tramite fotocamera.
          </p>
        </Link>

        <Link
          href="/stocks"
          className="rounded-3xl bg-emerald-600 p-6 text-white shadow ring-1 ring-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-emerald-100">
            Consumabili
          </p>
          <h2 className="mt-2 text-2xl font-bold">Stock e consumabili</h2>
          <p className="mt-2 text-emerald-100">
            Gestisci quantità, carichi, scarichi, rientri e soglie minime.
          </p>
        </Link>

        <Link
          href="/events"
          className="rounded-3xl bg-orange-500 p-6 text-white shadow ring-1 ring-orange-400/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-orange-100">
            Logistica
          </p>
          <h2 className="mt-2 text-2xl font-bold">Eventi e fiere</h2>
          <p className="mt-2 text-orange-100">
            Prepara eventi, scarica consumabili, collega asset e registra rientri.
          </p>
        </Link>

        <Link
          href="/labels"
          className="rounded-3xl bg-white p-6 text-gray-900 shadow ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Etichette
          </p>
          <h2 className="mt-2 text-2xl font-bold">Stampa QR</h2>
          <p className="mt-2 text-gray-600">
            Seleziona gli asset e stampa le etichette QR da applicare ai beni.
          </p>
        </Link>

        <SectionCard className="md:col-span-2 xl:col-span-6" title="In evoluzione" description="Prossimi moduli">
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• alert ritardi e incongruenze</li>
            <li>• report evento PDF</li>
            <li>• login utenti e permessi</li>
          </ul>
        </SectionCard>
      </section>
    </main>
  );
}
