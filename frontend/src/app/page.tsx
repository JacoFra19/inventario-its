import { getAssets, getEvent, getEvents, getItems, getStocks } from "@/lib/api";

export default async function Home() {
  const [assets, stocks, events, items] = await Promise.all([
    getAssets(),
    getStocks(),
    getEvents(),
    getItems(),
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

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Item a catalogo</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            Tipologie bene disponibili per creare asset e stock.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Asset fisici</p>
          <p className="mt-2 text-3xl font-bold">{assets.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            {percentualeInSede}% attualmente in sede.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Eventi totali</p>
          <p className="mt-2 text-3xl font-bold">{events.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            {eventiAperti} aperti, {eventiChiusi} chiusi, {eventiAnnullati} annullati.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Stock monitorati</p>
          <p className="mt-2 text-3xl font-bold">{stocks.length}</p>
          <p className="mt-2 text-sm text-gray-500">
            {stockSottoSoglia} sotto soglia minima.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Eventi recenti
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Ultime movimentazioni logistiche
            </h2>
          </div>

          <a href="/events" className="text-sm font-semibold text-blue-600 hover:underline">
            Vai agli eventi →
          </a>
        </div>

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
                <a
                  key={detail.event.id}
                  href={`/events?eventId=${detail.event.id}`}
                  className="rounded-2xl border p-5 transition hover:bg-gray-50"
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

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        detail.event.status === "OPEN"
                          ? "bg-blue-100 text-blue-700"
                          : detail.event.status === "CLOSED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {detail.event.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Asset fuori</p>
                      <p className="mt-1 text-xl font-bold">{openAssets}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Stock da rientrare</p>
                      <p className="mt-1 text-xl font-bold">{stockToReturn}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Mancanti</p>
                      <p className="mt-1 text-xl font-bold">{missingAssets}</p>
                    </div>
                  </div>

                  {needsAttention && (
                    <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm font-medium text-yellow-800">
                      Materiale ancora da verificare prima della chiusura.
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        )}
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Distribuzione asset
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Stato inventario fisico
            </h2>
          </div>

          <a href="/assets" className="text-sm font-semibold text-blue-600 hover:underline">
            Vai agli asset →
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <a href="/assets" className="rounded-xl border p-4 transition hover:bg-gray-50">
            <p className="text-sm text-gray-500">In sede</p>
            <p className="mt-1 text-2xl font-bold">{inSede}</p>
          </a>

          <a href="/assets" className="rounded-xl border p-4 transition hover:bg-gray-50">
            <p className="text-sm text-gray-500">Assegnati</p>
            <p className="mt-1 text-2xl font-bold">{assegnati}</p>
          </a>

          <a href="/assets" className="rounded-xl border p-4 transition hover:bg-gray-50">
            <p className="text-sm text-gray-500">In evento</p>
            <p className="mt-1 text-2xl font-bold">{assetInEvento}</p>
          </a>

          <a href="/assets" className="rounded-xl border p-4 transition hover:bg-gray-50">
            <p className="text-sm text-gray-500">Mancanti</p>
            <p className="mt-1 text-2xl font-bold">{assetMancanti}</p>
          </a>
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
            href="/stocks?lowStock=1"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Stock sotto soglia</p>
            <p className="mt-1 text-2xl font-bold">{stockSottoSoglia}</p>
          </a>

          <a
            href="/events?status=OPEN"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Eventi aperti</p>
            <p className="mt-1 text-2xl font-bold">{eventiAperti}</p>
          </a>

          <a
            href="/assets?status=IN_EVENTO"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Asset in evento</p>
            <p className="mt-1 text-2xl font-bold">{assetInEvento}</p>
          </a>

          <a
            href="/assets?status=MANCANTE"
            className="rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Asset mancanti</p>
            <p className="mt-1 text-2xl font-bold">{assetMancanti}</p>
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
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
          href="/items"
          className="rounded-2xl bg-indigo-600 p-6 text-white shadow transition hover:bg-indigo-700"
        >
          <p className="text-sm uppercase tracking-wide text-indigo-100">
            Catalogo tecnico
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gestisci Item</h2>
          <p className="mt-2 text-indigo-100">
            Crea, modifica e pulisci le tipologie bene usate dagli asset.
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

        <div className="rounded-2xl bg-white p-6 shadow md:col-span-2 xl:col-span-6">
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