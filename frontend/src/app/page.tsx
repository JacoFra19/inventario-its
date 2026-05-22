import { getAssets, getEvents, getStocks } from "@/lib/api";

export default async function Home() {
  const [assets, stocks, events] = await Promise.all([
    getAssets(),
    getStocks(),
    getEvents(),
  ]);

  const inSede = assets.filter((asset) => asset.status === "IN_SEDE").length;
  const assegnati = assets.filter((asset) => asset.status === "ASSEGNATO").length;
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

  const hasAlerts =
    stockSottoSoglia > 0 ||
    assetInEvento > 0 ||
    assetMancanti > 0 ||
    eventiAperti > 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <section className="mb-8 rounded-3xl bg-gray-900 p-8 text-white shadow">
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

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Asset totali</p>
          <p className="mt-2 text-3xl font-bold">{assets.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">In sede</p>
          <p className="mt-2 text-3xl font-bold">{inSede}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Assegnati</p>
          <p className="mt-2 text-3xl font-bold">{assegnati}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Stockcard</p>
          <p className="mt-2 text-3xl font-bold">{stocks.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Stock sotto soglia</p>
          <p className="mt-2 text-3xl font-bold">{stockSottoSoglia}</p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Alert operativi
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Situazione da monitorare
            </h2>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              hasAlerts
                ? "bg-red-100 text-red-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {hasAlerts ? "Richiede attenzione" : "Tutto regolare"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <a
            href="/stocks"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Stock sotto soglia</p>
            <p className="mt-1 text-2xl font-bold">{stockSottoSoglia}</p>
          </a>

          <a
            href="/events"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Eventi aperti</p>
            <p className="mt-1 text-2xl font-bold">{eventiAperti}</p>
          </a>

          <a
            href="/assets"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Asset in evento</p>
            <p className="mt-1 text-2xl font-bold">{assetInEvento}</p>
          </a>

          <a
            href="/assets"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Asset mancanti</p>
            <p className="mt-1 text-2xl font-bold">{assetMancanti}</p>
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <a
          href="/assets"
          className="rounded-2xl bg-blue-600 p-6 text-white shadow transition hover:bg-blue-700"
        >
          <p className="text-sm uppercase tracking-wide text-blue-100">
            Asset serializzati
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gestisci Asset</h2>
          <p className="mt-2 text-blue-100">
            Consulta, crea, trasferisci e assegna i beni inventariati.
          </p>
        </a>

        <a
          href="/scan"
          className="rounded-2xl bg-gray-900 p-6 text-white shadow transition hover:bg-black"
        >
          <p className="text-sm uppercase tracking-wide text-gray-300">
            Scanner mobile
          </p>
          <h2 className="mt-2 text-2xl font-bold">Apri Scanner QR</h2>
          <p className="mt-2 text-gray-300">
            Scansiona rapidamente i QR code degli asset tramite fotocamera.
          </p>
        </a>

        <a
          href="/stocks"
          className="rounded-2xl bg-emerald-600 p-6 text-white shadow transition hover:bg-emerald-700"
        >
          <p className="text-sm uppercase tracking-wide text-emerald-100">
            Consumabili
          </p>
          <h2 className="mt-2 text-2xl font-bold">Stock e consumabili</h2>
          <p className="mt-2 text-emerald-100">
            Gestisci quantità, carichi, scarichi, rientri e soglie minime.
          </p>
        </a>

        <a
          href="/events"
          className="rounded-2xl bg-orange-500 p-6 text-white shadow transition hover:bg-orange-600"
        >
          <p className="text-sm uppercase tracking-wide text-orange-100">
            Logistica
          </p>
          <h2 className="mt-2 text-2xl font-bold">Eventi e fiere</h2>
          <p className="mt-2 text-orange-100">
            Prepara eventi, scarica consumabili, collega asset e registra rientri.
          </p>
        </a>

        <a
          href="/labels"
          className="rounded-2xl bg-white p-6 text-gray-900 shadow transition hover:bg-gray-50"
        >
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Etichette
          </p>
          <h2 className="mt-2 text-2xl font-bold">Stampa QR</h2>
          <p className="mt-2 text-gray-600">
            Seleziona gli asset e stampa le etichette QR da applicare ai beni.
          </p>
        </a>

        <div className="rounded-2xl bg-white p-6 shadow md:col-span-2 xl:col-span-5">
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Prossimi moduli
          </p>
          <h2 className="mt-2 text-2xl font-bold">In evoluzione</h2>
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• alert ritardi e incongruenze</li>
            <li>• report evento PDF</li>
            <li>• login utenti e permessi</li>
          </ul>
        </div>
      </section>
    </main>
  );
}