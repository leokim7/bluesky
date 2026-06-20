"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { ActivityId } from "@/lib/activities";
import { getActivity } from "@/lib/activities";
import { fetchVenuesByActivity, type Venue } from "@/lib/venues";

type Props = {
  map: mapboxgl.Map;
  activity: ActivityId | null;
  onVenueClick: (v: Venue) => void;
};

export function VenueMarkers({ map, activity, onVenueClick }: Props) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // ── Fetch venues when activity changes ─────────────
  useEffect(() => {
    if (!activity) {
      setVenues([]);
      return;
    }
    let alive = true;
    fetchVenuesByActivity(activity).then((vs) => {
      if (alive) setVenues(vs);
    });
    return () => { alive = false; };
  }, [activity]);

  // ── Render markers ─────────────────────────────────
  useEffect(() => {
    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!activity || venues.length === 0) return;

    const act = getActivity(activity);
    if (!act) return;

    venues.forEach((v) => {
      // Wrapper — Mapbox 가 translate 로 위치 잡는 컨테이너 (transform 건드리지 말 것)
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "width: 28px; height: 28px; cursor: pointer;";

      // Inner — 시각 요소. scale 등 transform 자유롭게 사용 가능
      const inner = document.createElement("div");
      inner.className = "venue-marker";
      inner.style.cssText = `
        width: 100%; height: 100%;
        background: ${act.color};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0A0F1A;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        transform-origin: center center;
      `;
      inner.textContent = v.name.charAt(0);
      wrapper.title = v.name;
      wrapper.appendChild(inner);

      wrapper.addEventListener("mouseenter", () => {
        inner.style.transform = "scale(1.18)";
        inner.style.boxShadow = `0 4px 14px ${act.color}80, 0 2px 8px rgba(0,0,0,0.5)`;
      });
      wrapper.addEventListener("mouseleave", () => {
        inner.style.transform = "scale(1)";
        inner.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
      });
      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        onVenueClick(v);
      });

      const marker = new mapboxgl.Marker({ element: wrapper })
        .setLngLat([v.lon, v.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds to all venues
    if (venues.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      venues.forEach((v) => bounds.extend([v.lon, v.lat]));
      map.fitBounds(bounds, { padding: 100, duration: 700, maxZoom: 8 });
    } else if (venues.length === 1) {
      map.flyTo({ center: [venues[0].lon, venues[0].lat], zoom: 9, duration: 700 });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [activity, venues, map, onVenueClick]);

  return null;
}
