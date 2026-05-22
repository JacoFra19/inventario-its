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

export type StockCard = {
  id: number;
  item_id: number;
  location_id: number;
  quantity: number;
  min_threshold: number;
  notes: string | null;
};

export type StockMovement = {
  id: number;
  stock_card_id: number;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
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

export async function getStocks(): Promise<StockCard[]> {
  const res = await fetch(`${API_BASE}/stocks`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero degli stock");
  }

  return res.json();
}

export async function createStock(input: {
  itemId: number;
  locationCode: string;
  quantity: number;
  minThreshold: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/stocks`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      item_id: input.itemId,
      location_code: input.locationCode,
      quantity: input.quantity,
      min_threshold: input.minThreshold,
      notes: input.notes ?? null,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function createStockMovement(input: {
  stockId: number;
  movementType: "LOAD" | "UNLOAD" | "RETURN" | "ADJUST";
  quantity: number;
  notes?: string;
}) {
  const res = await fetch(
    `${API_BASE}/stocks/${input.stockId}/movement`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        movement_type: input.movementType,
        quantity: input.quantity,
        notes: input.notes ?? null,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getStockHistory(
  stockId: number
): Promise<StockMovement[]> {
  const res = await fetch(`${API_BASE}/stocks/${stockId}/history`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

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

export type AssetTransferMovement = {
  id: number;
  asset_id: number;
  from_location_id: number | null;
  to_location_id: number;
  moved_at: string;
  moved_by: string | null;
  notes: string | null;
};

export async function getAssetHistory(assetId: number): Promise<AssetTransferMovement[]> {
  const res = await fetch(`${API_BASE}/assets/${assetId}/history`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function assignAsset(input: {
  assetId: number;
  assignedTo: string;
  notes?: string;
}) {
  const res = await fetch(
    `${API_BASE}/assets/${input.assetId}/assign`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assigned_to: input.assignedTo,
        notes: input.notes ?? null,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function unassignAsset(assetId: number) {
  const res = await fetch(
    `${API_BASE}/assets/${assetId}/unassign`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export type Event = {
  id: number;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  manager: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type EventAsset = {
  id: number;
  event_id: number;
  asset_id: number;
  status: string;
  notes: string | null;
  created_at: string;
  returned_at: string | null;
};

export type EventStock = {
  id: number;
  event_id: number;
  stock_card_id: number;
  quantity_out: number;
  quantity_returned: number;
  notes: string | null;
  created_at: string;
};

export type EventDetail = {
  event: Event;
  assets: EventAsset[];
  stocks: EventStock[];
};

export async function getEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero degli eventi");
  }

  return res.json();
}

export async function createEvent(input: {
  name: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  manager?: string;
  notes?: string;
}): Promise<Event> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      location: input.location || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      manager: input.manager || null,
      notes: input.notes || null,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getEvent(eventId: number): Promise<EventDetail> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function addAssetToEvent(input: {
  eventId: number;
  assetId: number;
  notes?: string;
}): Promise<EventAsset> {
  const res = await fetch(`${API_BASE}/events/${input.eventId}/assets`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      asset_id: input.assetId,
      notes: input.notes || null,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function addStockToEvent(input: {
  eventId: number;
  stockCardId: number;
  quantityOut: number;
  notes?: string;
}): Promise<EventStock> {
  const res = await fetch(`${API_BASE}/events/${input.eventId}/stocks`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stock_card_id: input.stockCardId,
      quantity_out: input.quantityOut,
      notes: input.notes || null,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function returnEventAsset(input: {
  eventId: number;
  eventAssetId: number;
}): Promise<EventAsset> {
  const res = await fetch(
    `${API_BASE}/events/${input.eventId}/assets/${input.eventAssetId}/return`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function markEventAssetMissing(input: {
  eventId: number;
  eventAssetId: number;
}): Promise<EventAsset> {
  const res = await fetch(
    `${API_BASE}/events/${input.eventId}/assets/${input.eventAssetId}/missing`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function returnEventStock(input: {
  eventId: number;
  eventStockId: number;
  quantityReturned: number;
  notes?: string;
}): Promise<EventStock> {
  const res = await fetch(
    `${API_BASE}/events/${input.eventId}/stocks/${input.eventStockId}/return`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity_returned: input.quantityReturned,
        notes: input.notes || null,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}