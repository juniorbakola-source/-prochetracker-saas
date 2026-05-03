export const COLORS: string[] = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
];

export interface UserPosition {
  id: string;
  name: string;
  color: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
  isMe?: boolean;
}
