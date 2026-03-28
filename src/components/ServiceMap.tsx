import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCategoryEmoji } from "@/lib/categories";

interface MapProvider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  rating?: number;
  distance_km?: number;
  price?: number;
  hasBid?: boolean;
}

interface ServiceMapProps {
  center: { lat: number; lng: number };
  providers: MapProvider[];
  heatmapPoints?: { lat: number; lng: number; intensity: number }[];
  onProviderClick?: (id: string) => void;
  className?: string;
}

export function ServiceMap({ center, providers, heatmapPoints, onProviderClick, className }: ServiceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(leafletMap.current);

    markersRef.current = L.layerGroup().addTo(leafletMap.current);
    heatRef.current = L.layerGroup().addTo(leafletMap.current);

    // User marker
    const userIcon = L.divIcon({
      className: "user-marker",
      html: `<div style="width:16px;height:16px;background:hsl(0,85%,50%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([center.lat, center.lng], { icon: userIcon })
      .addTo(leafletMap.current)
      .bindPopup("<b>Your Location</b>");

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    leafletMap.current?.setView([center.lat, center.lng], 14);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    providers.forEach((p) => {
      const emoji = getCategoryEmoji(p.category);
      const isBidder = p.hasBid;
      const icon = L.divIcon({
        className: "provider-marker",
        html: `<div style="
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          background:${isBidder ? "hsl(0,85%,50%)" : "white"};
          color:${isBidder ? "white" : "inherit"};
          border:2px solid ${isBidder ? "hsl(0,85%,40%)" : "#ddd"};
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
          cursor:pointer;
          transition: transform 0.2s;
        ">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([p.lat, p.lng], { icon }).addTo(markersRef.current!);
      
      const etaMin = Math.max(3, Math.round((p.distance_km || 1) / 20 * 60 + 5));
      marker.bindPopup(`
        <div style="min-width:160px;font-family:Inter,sans-serif;">
          <b style="font-size:14px;">${p.name}</b><br/>
          <span style="color:#666;font-size:12px;">${emoji} ${p.category}</span><br/>
          ${p.rating ? `<span style="font-size:12px;">⭐ ${p.rating.toFixed(1)}</span><br/>` : ""}
          ${p.distance_km ? `<span style="font-size:12px;">📍 ${p.distance_km.toFixed(1)} km</span><br/>` : ""}
          <span style="font-size:12px;">🕐 ~${etaMin} min ETA</span><br/>
          ${p.price ? `<b style="font-size:14px;color:hsl(0,85%,50%);">CHF ${p.price.toFixed(0)}</b>` : ""}
        </div>
      `);

      if (onProviderClick) {
        marker.on("click", () => onProviderClick(p.id));
      }
    });
  }, [providers, onProviderClick]);

  useEffect(() => {
    if (!heatRef.current) return;
    heatRef.current.clearLayers();

    (heatmapPoints || []).forEach((pt) => {
      L.circle([pt.lat, pt.lng], {
        radius: 200 + pt.intensity * 100,
        color: "transparent",
        fillColor: `hsl(0, 85%, ${60 - pt.intensity * 5}%)`,
        fillOpacity: 0.15 + pt.intensity * 0.05,
      }).addTo(heatRef.current!);
    });
  }, [heatmapPoints]);

  return (
    <div
      ref={mapRef}
      className={`rounded-lg border overflow-hidden relative ${className || ""}`}
      style={{ height: 400, zIndex: 0 }}
    />
  );
}
