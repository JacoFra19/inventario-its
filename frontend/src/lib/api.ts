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

export type Item = {
  id: number;
  name: string;
  category: string;
  is_serialized: boolean;
};

export type Location = {
  id: number;
  code: string;
  name: string;
};

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE}/assets`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero degli asset");
  return res.json();
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${API_BASE}/items`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero degli item");
  return res.json();
}

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_BASE}/locations`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero delle sedi");
  return res.json();
}

export async function createAsset(input: {
  itemId: number;
  locationCode: string;
  notes?: string;
}): Promise<Asset> {
  const params = new URLSearchParams({
    item_id: String(input.itemId),
    location_code: input.locationCode,
  });

  if (input.notes?.trim()) {
    params.set("notes", input.notes.trim());
  }

  const res = await fetch(`${API_BASE}/assets?${params.toString()}`, {
    method: "POST",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function createItem(input: {
  name: string;
  category: string;
  isSerialized: boolean;
}): Promise<Item> {
  const res = await fetch(`${API_BASE}/items`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      is_serialized: input.isSerialized,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function transferAsset(input: {
  assetId: number;
  toLocationCode: string;
}) {
  const res = await fetch(
    `${API_BASE}/assets/${input.assetId}/transfer`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to_location_code: input.toLocationCode,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}