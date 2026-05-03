import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { UserPosition } from '../types';

// Fix Leaflet's default icon path issue with Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  members: UserPosition[];
  onMemberClick?: (member: UserPosition) => void;
  center?: [number, number];
}

export default function MapView({ members, onMemberClick, center }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialise map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: L.LatLngExpression = center ?? [48.856614, 2.3522219];

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever members list changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove stale markers
    const currentIds = new Set(members.map((m) => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    members.forEach((member) => {
      const initial = member.name.charAt(0).toUpperCase();
      const icon = L.divIcon({
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${member.color};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:15px;
          font-family:system-ui,sans-serif;">${initial}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const existing = markersRef.current.get(member.id);
      if (existing) {
        existing.setLatLng([member.lat, member.lng]);
        existing.setIcon(icon);
      } else {
        const marker = L.marker([member.lat, member.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${member.name}</strong>${member.isMe ? ' (moi)' : ''}`);

        if (onMemberClick) {
          marker.on('click', () => onMemberClick(member));
        }

        markersRef.current.set(member.id, marker);
      }
    });
  }, [members, onMemberClick]);

  // Pan to new center (e.g. when user selects a member)
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.panTo(center, { animate: true });
    }
  }, [center]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
