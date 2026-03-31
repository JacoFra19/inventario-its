import { getAssets } from "@/lib/api";

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">Lista Asset</h1>

      <div className="overflow-x-auto rounded-xl shadow border">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Codice</th>
              <th className="text-left p-4">Sede</th>
              <th className="text-left p-4">Stato</th>
              <th className="text-left p-4">Assegnato a</th>
              <th className="text-left p-4">Note</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t">
                <td className="p-4">{asset.id}</td>
                <td className="p-4 font-mono">{asset.inventory_code}</td>
                <td className="p-4">{asset.current_location_id}</td>
                <td className="p-4">{asset.status}</td>
                <td className="p-4">{asset.assigned_to ?? "-"}</td>
                <td className="p-4">{asset.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}