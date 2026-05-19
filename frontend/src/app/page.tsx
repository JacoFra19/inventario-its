import { getAssets, getLocations } from "@/lib/api";

export default async function Home() {
  const [assets, locations] = await Promise.all([
    getAssets(),
    getLocations(),
  ]);

  const inSede = assets.filter((asset) => asset.status === "IN_SEDE").length;
  const assegnati = assets.filter((asset) => asset.status === "ASSEGNATO").length;

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

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
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
          <p className="text-sm text-gray-500">Sedi censite</p>
          <p className="mt-2 text-3xl font-bold">{locations.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href="/assets"
          className="rounded-2xl bg-blue-600 p-6 text-white shadow transition hover:bg-blue-700"
        >
          <p className="text-sm uppercase tracking-wide text-blue-100">
            Gestione inventario
          </p>
          <h2 className="mt-2 text-2xl font-bold">Vai agli Asset</h2>
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

        <div className="rounded-2xl bg-white p-6 shadow md:col-span-1">
          <p className="text-sm uppercase tracking-wide text-gray-500">
            Prossimi moduli
          </p>
          <h2 className="mt-2 text-2xl font-bold">In evoluzione</h2>
          <ul className="mt-3 space-y-2 text-gray-600">
            <li>• stampa etichette QR</li>
            <li>• alert ritardi e incongruenze</li>
            <li>• gestione stock e consumabili</li>
            <li>• modulo eventi e fiere</li>
          </ul>
        </div>
      </section>
    </main>
  );
}