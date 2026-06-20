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
      // Custom marker DOM
      const el = document.createElement("div");
      el.className = "venue-marker";
      el.style.cssText = `
        width: 28px; height: 28px;
        background: ${act.color};
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0A0F1A;
        font-weight: 700;
        font-size: 11px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        transition: transform 0.15s ease;
      `;
      el.textContent = v.name.charAt(0);
      el.title = v.name;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onVenueClick(v);
      });

      const marker = new mapboxgl.Marker({ element: el })
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
