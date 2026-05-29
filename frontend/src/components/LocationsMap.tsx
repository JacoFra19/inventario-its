"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { DashboardLocation } from "@/lib/api";

type LocationsMapProps = {
  locations: DashboardLocation[];
};

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markerClass(location: DashboardLocation) {
  if (location.alert_level === "critical") {
    return "map-location-marker map-location-marker--critical";
  }

  if (location.alert_level === "warning") {
    return "map-location-marker map-location-marker--warning";
  }

  return "map-location-marker map-location-marker--normal";
}

function markerIcon(location: DashboardLocation) {
  return L.divIcon({
    className: "",
    html: `<span class="${markerClass(location)}">${escapeHtml(location.code)}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
}

function clusterIcon(cluster: L.MarkerCluster) {
  return L.divIcon({
    className: "",
    html: `<span class="map-location-cluster">${cluster.getChildCount()}</span>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
}

function popupHtml(location: DashboardLocation) {
  const locationId = encodeURIComponent(location.location_id);

  return `
    <div class="map-location-popup">
      <p class="map-location-popup-code">${escapeHtml(location.code)}</p>
      <h3 class="map-location-popup-title">${escapeHtml(location.name)}</h3>

      <div class="map-location-popup-grid">
        <div>
          <p class="map-location-popup-label">Asset</p>
          <p class="map-location-popup-value">${location.asset_total}</p>
        </div>
        <div>
          <p class="map-location-popup-label">Stock</p>
          <p class="map-location-popup-value">${location.stock_quantity_total}</p>
        </div>
        <div>
          <p class="map-location-popup-label">Mancanti</p>
          <p class="map-location-popup-value">${location.asset_missing}</p>
        </div>
        <div>
          <p class="map-location-popup-label">Sotto soglia</p>
          <p class="map-location-popup-value">${location.low_stock_count}</p>
        </div>
        <div>
          <p class="map-location-popup-label">Eventi aperti</p>
          <p class="map-location-popup-value">${location.open_events_count}</p>
        </div>
        <div>
          <p class="map-location-popup-label">Criticità</p>
          <p class="map-location-popup-value">${location.alert_count}</p>
        </div>
      </div>

      <div class="map-location-popup-actions">
        <a class="map-location-popup-link map-location-popup-link--primary" href="/assets?locationId=${locationId}">Asset</a>
        <a class="map-location-popup-link" href="/stocks?locationId=${locationId}">Stock</a>
        <a class="map-location-popup-link" href="/events">Eventi</a>
      </div>
    </div>
  `;
}

function LocationsClusterLayer({ locations }: LocationsMapProps) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 13,
      iconCreateFunction: clusterIcon,
      maxClusterRadius: 42,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      spiderLegPolylineOptions: {
        color: "#111827",
        opacity: 0.45,
        weight: 2,
      },
    });

    locations.forEach((location) => {
      if (typeof location.lat !== "number" || typeof location.lng !== "number") {
        return;
      }

      const marker = L.marker([location.lat, location.lng], {
        icon: markerIcon(location),
        keyboard: true,
        title: `${location.code} - ${location.name}`,
      });

      marker.bindTooltip(
        `<strong>${escapeHtml(location.code)} - ${escapeHtml(location.name)}</strong>`,
        { direction: "top", offset: [0, -12], opacity: 1 }
      );
      marker.bindPopup(popupHtml(location), { maxWidth: 320 });
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
    };
  }, [locations, map]);

  return null;
}

export default function LocationsMap({ locations }: LocationsMapProps) {
  const mappedLocations = locations.filter(
    (location) => typeof location.lat === "number" && typeof location.lng === "number"
  );

  if (mappedLocations.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-medium text-gray-600">
        Nessuna coordinata sede disponibile.
      </div>
    );
  }

  return (
    <div className="h-[520px] overflow-hidden rounded-3xl border border-gray-100 shadow-sm ring-1 ring-gray-100">
      <MapContainer
        center={[40.78, 17.25]}
        zoom={8}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationsClusterLayer locations={mappedLocations} />
      </MapContainer>
    </div>
  );
}
