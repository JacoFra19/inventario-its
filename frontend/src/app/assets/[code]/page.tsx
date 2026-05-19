type Props = {
  params: Promise<{
    code: string;
  }>;
};

export default async function AssetDetailPage({ params }: Props) {
  const { code } = await params;

  const res = await fetch(`http://localhost:8000/assets/${code}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <main className="p-10">Asset non trovato</main>;
  }

  const asset = await res.json();

  return (
    <main className="p-10">
      <a href="/assets" className="text-blue-600 hover:underline">
        ← Torna alla lista
      </a>

      <h1 className="text-2xl font-bold mt-6 mb-6">
        {asset.inventory_code}
      </h1>

      <div className="rounded-xl border p-6 space-y-3">
        <p><strong>ID:</strong> {asset.id}</p>
        <p><strong>Stato:</strong> {asset.status}</p>
        <p><strong>Sede ID:</strong> {asset.current_location_id}</p>
        <p><strong>Assegnato a:</strong> {asset.assigned_to ?? "-"}</p>
        <p><strong>Note:</strong> {asset.notes ?? "-"}</p>
      </div>

      <div className="mt-6">
        <h2 className="font-bold mb-2">QR Code</h2>
        <img
          src={`http://localhost:8000/assets/${asset.inventory_code}/qr`}
          alt="QR Code"
          className="w-40 h-40"
        />
      </div>
    </main>
  );
}