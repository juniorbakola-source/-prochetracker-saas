import type { UserPosition } from '../types';

interface MemberCardProps {
  member: UserPosition;
  onClick?: (member: UserPosition) => void;
  isSelected?: boolean;
}

function formatTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return "À l'instant";
  if (diffMs < 3_600_000) return `Il y a ${Math.floor(diffMs / 60_000)} min`;
  return `Il y a ${Math.floor(diffMs / 3_600_000)} h`;
}

export default function MemberCard({ member, onClick, isSelected }: MemberCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(member)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
        isSelected
          ? 'bg-blue-50 ring-2 ring-blue-500'
          : 'bg-white hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
        style={{ backgroundColor: member.color }}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {member.name}
          {member.isMe && (
            <span className="ml-1 text-blue-500 text-sm font-normal">(moi)</span>
          )}
        </p>
        <p className="text-sm text-gray-500">{formatTime(member.timestamp)}</p>
      </div>

      {/* Accuracy badge */}
      {member.accuracy !== undefined && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          ±{Math.round(member.accuracy)} m
        </span>
      )}
    </button>
  );
}
