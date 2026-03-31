const API_BASE = "http://localhost:8000";

export type Asset = {
  id: number;
  inventory_code: string;
  item_id: number;
  current_location_id: number;
  status: string;
  assigned_to: string | null;
  notes: string | null;
};

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE}/assets`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero degli asset");
  }

  return res.json();
}