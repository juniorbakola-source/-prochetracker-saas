import { useState, useEffect, useRef } from 'react';
import type { UserPosition } from '../types';
import { supabase } from '../lib/supabase';

// ── Demo members shown when mode === 'demo' ───────────────────────────────────

const DEMO_MEMBERS: UserPosition[] = [
  {
    id: 'demo1',
    name: 'Alice',
    color: '#EF4444',
    lat: 48.856614,
    lng: 2.3522219,
    accuracy: 10,
    timestamp: Date.now(),
  },
  {
    id: 'demo2',
    name: 'Bob',
    color: '#22C55E',
    lat: 48.858614,
    lng: 2.3542219,
    accuracy: 15,
    timestamp: Date.now(),
  },
];

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface UseLocationSharingReturn {
  myPosition: UserPosition | null;
  members: UserPosition[];
  isConnected: boolean;
  error: string | null;
}

export function useLocationSharing(
  userId: string,
  userName: string,
  userColor: string,
  groupCode: string | null,
  mode: 'demo' | 'local' | 'supabase',
  geoPosition: GeoPosition | null,
): UseLocationSharingReturn {
  const [members, setMembers] = useState<UserPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the Supabase channel so we can broadcast position updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseChannelRef = useRef<any>(null);

  const myPosition: UserPosition | null = geoPosition
    ? {
        id: userId,
        name: userName || 'Moi',
        color: userColor,
        lat: geoPosition.lat,
        lng: geoPosition.lng,
        accuracy: geoPosition.accuracy,
        timestamp: Date.now(),
        isMe: true,
      }
    : null;

  // ── Connect / disconnect when groupCode or mode changes ──────────────────
  useEffect(() => {
    if (!groupCode) {
      setMembers([]);
      setIsConnected(false);
      return;
    }

    if (mode === 'demo') {
      setMembers(DEMO_MEMBERS.filter((m) => m.id !== userId));
      setIsConnected(true);
      return () => {
        setIsConnected(false);
      };
    }

    if (mode === 'local') {
      const bc = new BroadcastChannel(`prochetracker-${groupCode}`);
      setIsConnected(true);

      bc.onmessage = (event: MessageEvent<UserPosition>) => {
        const pos = event.data;
        if (pos.id === userId) return;
        setMembers((prev) => {
          const idx = prev.findIndex((m) => m.id === pos.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = pos;
            return next;
          }
          return [...prev, pos];
        });
      };

      return () => {
        bc.close();
        setIsConnected(false);
      };
    }

    if (mode === 'supabase') {
      if (!supabase) {
        setError(
          'Supabase non configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
        );
        return;
      }

      const channel = supabase.channel(`group:${groupCode}`);
      supabaseChannelRef.current = channel;

      channel.on(
        'broadcast',
        { event: 'position' },
        ({ payload }: { payload: UserPosition }) => {
          if (payload.id === userId) return;
          setMembers((prev) => {
            const idx = prev.findIndex((m) => m.id === payload.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = payload;
              return next;
            }
            return [...prev, payload];
          });
        },
      );

      channel.subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

      return () => {
        channel.unsubscribe();
        supabaseChannelRef.current = null;
        setIsConnected(false);
      };
    }
  }, [groupCode, mode, userId]);

  // ── Broadcast own position whenever it changes ────────────────────────────
  useEffect(() => {
    if (!myPosition || !groupCode) return;

    if (mode === 'local') {
      const bc = new BroadcastChannel(`prochetracker-${groupCode}`);
      bc.postMessage(myPosition);
      bc.close();
    }

    if (mode === 'supabase' && supabaseChannelRef.current && isConnected) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'position',
        payload: myPosition,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPosition?.lat, myPosition?.lng, groupCode, mode, isConnected]);

  return { myPosition, members, isConnected, error };
}
