import { getAssets, getLocations, getStocks } from "@/lib/api";

export default async function Home() {
  const [assets, locations, stocks] = await Promise.all([
    getAssets(),
    getLocations(),
    getStocks(),
  ]);

  const inSede = assets.filter((asset) => asset.status === "IN_SEDE").length;
  const assegnati = assets.filter((asset) => asset.status === "ASSEGNATO").length;
  const stockSottoSoglia = stocks.filter(
    (stock) => stock.quantity <= stock.min_threshold
  ).length;

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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="rounded-2xl bg-white p-6 shadow md:col-span-2 xl:col-span-4">
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Prossimi moduli
          </p>
          <h2 className="mt-2 text-2xl font-bold">In evoluzione</h2>
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• alert ritardi e incongruenze</li>
            <li>• modulo eventi e fiere</li>
            <li>• login utenti e permessi</li>
          </ul>
        </div>
      </section>
    </main>
  );
}