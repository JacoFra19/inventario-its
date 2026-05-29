const API_BASE = "http://localhost:8000";

export type Asset = {
  id: number;
  inventory_code: string;
  item_id: number;
  current_location_id: number;
  assignee_id: number | null;
  status: string;
  assigned_to: string | null;
  notes: string | null;
};

export type Item = {
  id: number;
  name: string;
  category_id: number;
  category: Category | null;
  brand: string | null;
  model: string | null;
  technical_specs: string | null;
  is_serialized: boolean;
  asset_count: number | null;
  stock_card_count: number | null;
};

export type Location = {
  id: number;
  code: string;
  name: string;
};

export type Category = {
  id: number;
  name: string;
};

export type AssetDetail = {
  asset: Asset;
  item: Item | null;
  location: Location | null;
  assignee: Assignee | null;
};

export type AssigneeType = "PERSON" | "DEPARTMENT" | "OTHER";

export type AssigneeAsset = {
  id: number;
  inventory_code: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
};

export type Assignee = {
  id: number;
  name: string;
  type: AssigneeType;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  asset_count: number | null;
  assets?: AssigneeAsset[];
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

export type AlertSeverity = "critical" | "warning";

export type OperationalAlert = {
  type: string;
  message: string;
  references: Record<string, string | number | null>;
};

export type AlertsResponse = {
  critical: OperationalAlert[];
  warning: OperationalAlert[];
};

export type DashboardActivity = {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  category: string;
  severity: string;
  references: Record<string, string | number | null>;
};

export type DashboardLocation = {
  location_id: number;
  code: string;
  name: string;
  asset_total: number;
  asset_in_location: number;
  asset_assigned: number;
  asset_in_event: number;
  asset_missing: number;
  stockcard_count: number;
  stock_quantity_total: number;
  low_stock_count: number;
  open_events_count: number;
  alert_count: number;
  alert_level: "none" | "warning" | "critical";
};

export type GlobalSearchResult = {
  type: "asset" | "item" | "stock" | "event";
  title: string;
  description: string;
  href: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type GlobalSearchResponse = {
  query: string;
  results: {
    assets: GlobalSearchResult[];
    items: GlobalSearchResult[];
    stocks: GlobalSearchResult[];
    events: GlobalSearchResult[];
  };
};

export type ImportPreviewRow = {
  row_number: number;
  type: string;
  description: string;
  status: "VALID" | "WARNING" | "ERROR";
  message: string;
};

export type ImportPreviewSummary = {
  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  items_to_create: number;
  items_to_reuse: number;
  categories_to_create: number;
  asset_to_create: number;
  stockcard_to_create: number;
  stockcard_to_update: number;
  assignee_to_create: number;
  assignee_to_reuse: number;
};

export type ImportPreviewResponse = {
  rows: ImportPreviewRow[];
  summary: ImportPreviewSummary;
  can_commit: boolean;
};

export type ImportCommitResponse = {
  committed: boolean;
  summary: ImportPreviewSummary;
  result: {
    created_assets: number;
    created_stockcards: number;
    updated_stockcards: number;
    created_items: number;
    reused_items: number;
    created_assignees: number;
    reused_assignees: number;
  };
};

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE}/assets`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero degli asset");
  return res.json();
}

export async function getAssetDetail(inventoryCode: string): Promise<AssetDetail> {
  const res = await fetch(`${API_BASE}/assets/${inventoryCode}/detail`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(`${API_BASE}/items`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero degli item");
  return res.json();
}

export async function getItem(itemId: number): Promise<Item> {
  const res = await fetch(`${API_BASE}/items/${itemId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getLocations(): Promise<Location[]> {
  const res = await fetch(`${API_BASE}/locations`, { cache: "no-store" });
  if (!res.ok) throw new Error("Errore nel recupero delle sedi");
  return res.json();
}

export async function getAssignees(): Promise<Assignee[]> {
  const res = await fetch(`${API_BASE}/assignees`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Errore nel recupero degli assegnatari");
  }

  return res.json();
}

export async function getAssignee(assigneeId: number): Promise<Assignee> {
  const res = await fetch(`${API_BASE}/assignees/${assigneeId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function createAssignee(input: {
  name: string;
  type: AssigneeType;
  email?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}): Promise<Assignee> {
  const res = await fetch(`${API_BASE}/assignees`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      email: input.email || null,
      phone: input.phone || null,
      notes: input.notes || null,
      is_active: input.isActive ?? true,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function updateAssignee(input: {
  assigneeId: number;
  name: string;
  type: AssigneeType;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}): Promise<Assignee> {
  const res = await fetch(`${API_BASE}/assignees/${input.assigneeId}`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      email: input.email || null,
      phone: input.phone || null,
      notes: input.notes || null,
      is_active: input.isActive,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function deleteAssignee(
  assigneeId: number
): Promise<{ deleted: boolean; deactivated: boolean; assignee_id: number; detail?: string }> {
  const res = await fetch(`${API_BASE}/assignees/${assigneeId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero delle categorie");
  }

  return res.json();
}

export async function getAlerts(): Promise<AlertsResponse> {
  const res = await fetch(`${API_BASE}/alerts`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero degli alert operativi");
  }

  return res.json();
}

export async function getDashboardActivity(): Promise<DashboardActivity[]> {
  const res = await fetch(`${API_BASE}/dashboard/activity`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero delle attività recenti");
  }

  return res.json();
}

export async function getDashboardLocations(): Promise<DashboardLocation[]> {
  const res = await fetch(`${API_BASE}/dashboard/locations`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Errore nel recupero della panoramica sedi");
  }

  return res.json();
}

export async function searchGlobal(
  query: string,
  signal?: AbortSignal
): Promise<GlobalSearchResponse> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error("Errore durante la ricerca globale");
  }

  return res.json();
}

export function getAssetsExportUrl() {
  return `${API_BASE}/exports/assets.xlsx`;
}

export function getStocksExportUrl() {
  return `${API_BASE}/exports/stocks.xlsx`;
}

export function getEventsExportUrl() {
  return `${API_BASE}/exports/events.xlsx`;
}

export function getImportTemplateUrl() {
  return `${API_BASE}/imports/template.xlsx`;
}

export async function previewImport(file: File): Promise<ImportPreviewResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/imports/preview`, {
    method: "POST",
    cache: "no-store",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function commitImport(file: File): Promise<ImportCommitResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/imports/commit`, {
    method: "POST",
    cache: "no-store",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

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
  categoryId: number;
  brand?: string;
  model?: string;
  technicalSpecs?: string;
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
      category_id: input.categoryId,
      brand: input.brand || null,
      model: input.model || null,
      technical_specs: input.technicalSpecs || null,
      is_serialized: input.isSerialized,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function deleteItem(itemId: number): Promise<{ deleted: boolean; item_id: number }> {
  const res = await fetch(`${API_BASE}/items/${itemId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function updateItem(input: {
  itemId: number;
  name: string;
  categoryId: number;
  brand?: string;
  model?: string;
  technicalSpecs?: string;
  isSerialized: boolean;
}): Promise<Item> {
  const res = await fetch(`${API_BASE}/items/${input.itemId}`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      category_id: input.categoryId,
      brand: input.brand || null,
      model: input.model || null,
      technical_specs: input.technicalSpecs || null,
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

export type AssetLog = {
  id: number;
  asset_id: number;
  action_type: string;
  description: string;
  created_at: string;
  created_by: string | null;
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

export async function getAssetLogs(assetId: number): Promise<AssetLog[]> {
  const res = await fetch(`${API_BASE}/assets/${assetId}/logs`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function assignAsset(input: {
  assetId: number;
  assignedTo?: string;
  assigneeId?: number;
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
        assigned_to: input.assignedTo ?? null,
        assignee_id: input.assigneeId ?? null,
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


export async function markAssetMissing(input: {
  assetId: number;
  notes?: string;
}): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets/${input.assetId}/missing`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input.notes ?? null),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function restoreAsset(assetId: number): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets/${assetId}/restore`, {
    method: "POST",
    cache: "no-store",
  });

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

export async function closeEvent(eventId: number): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${eventId}/close`, {
    method: "POST",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function cancelEvent(eventId: number): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${eventId}/cancel`, {
    method: "POST",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
