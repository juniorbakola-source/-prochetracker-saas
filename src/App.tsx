import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Users,
  Settings,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  LogOut,
  Wifi,
  WifiOff,
  Smartphone,
  Globe,
  Play,
  Info,
  X,
  EyeOff,
  Shield,
  Zap,
} from 'lucide-react';
import MapView from './components/MapView';
import MemberCard from './components/MemberCard';
import { useGeolocation } from './hooks/useGeolocation';
import { useLocationSharing } from './hooks/useLocationSharing';
import { COLORS } from './types';
import type { UserPosition } from './types';
import { getFromLocal, saveToLocal } from './lib/supabase';

type Screen = 'welcome' | 'profile' | 'group' | 'map' | 'settings';

function generateId(): string {
  // Use Web Crypto API for a cryptographically random ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  }
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateGroupCode(): string {
  // Unambiguous characters (no 0/O, 1/I/L) for easier manual entry
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [userId] = useState(() => getFromLocal('userId', generateId()));
  const [userName, setUserName] = useState(() => getFromLocal('userName', ''));
  const [userColor, setUserColor] = useState(() => getFromLocal('userColor', COLORS[0]));
  const [groupCode, setGroupCode] = useState<string | null>(() => getFromLocal('groupCode', null));
  const [groupName, setGroupName] = useState(() => getFromLocal('groupName', ''));
  const [mode, setMode] = useState<'demo' | 'local' | 'supabase'>(() =>
    getFromLocal('mode', 'demo'),
  );
  const [showMembers, setShowMembers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserPosition | null>(null);

  const geo = useGeolocation();
  const sharing = useLocationSharing(userId, userName, userColor, groupCode, mode, geo.position);

  // Persist preferences
  useEffect(() => {
    saveToLocal('userId', userId);
    saveToLocal('userName', userName);
    saveToLocal('userColor', userColor);
    saveToLocal('groupCode', groupCode);
    saveToLocal('groupName', groupName);
    saveToLocal('mode', mode);
  }, [userId, userName, userColor, groupCode, groupName, mode]);

  // Start / stop GPS tracking based on active screen
  useEffect(() => {
    if (screen === 'map') {
      geo.startTracking();
    } else {
      geo.stopTracking();
    }
    // geo ref is stable; we only want to react to screen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Auto-redirect if already configured
  useEffect(() => {
    if (userName && groupCode) {
      setScreen('map');
    } else if (userName) {
      setScreen('group');
    }
    // Run only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateGroup = () => {
    const code = generateGroupCode();
    setGroupCode(code);
    setGroupName(`Groupe ${code}`);
    setScreen('map');
  };

  const handleJoinGroup = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 3) {
      setJoinError('Code invalide (min. 3 caractères)');
      return;
    }
    setGroupCode(code);
    setGroupName(`Groupe ${code}`);
    setJoinError('');
    setScreen('map');
  };

  const handleLeaveGroup = () => {
    setGroupCode(null);
    setGroupName('');
    setScreen('group');
  };

  const handleCopyCode = () => {
    if (groupCode) {
      navigator.clipboard.writeText(groupCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMemberClick = useCallback((member: UserPosition) => {
    setSelectedMember(member);
  }, []);

  const allMembers = sharing.myPosition
    ? [sharing.myPosition, ...sharing.members]
    : sharing.members;

  // ── Screen: Welcome ──────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center p-6 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-sm"
        >
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">ProcheTracker</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-xs mx-auto">
            Localisez vos proches en temps réel, où que vous soyez
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Temps réel</p>
                <p className="text-sm text-blue-200">Mises à jour instantanées</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Sécurisé</p>
                <p className="text-sm text-blue-200">Partage contrôlé par code</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Partout</p>
                <p className="text-sm text-blue-200">Fonctionne dans le monde entier</p>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('profile')}
            className="bg-white text-blue-700 font-bold py-4 px-10 rounded-2xl text-lg shadow-xl hover:bg-blue-50 transition-colors"
          >
            Commencer
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Screen: Profile ──────────────────────────────────────────────────────
  if (screen === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mon profil</h2>
          <p className="text-gray-500 mb-6">Comment veux-tu apparaître sur la carte ?</p>

          {/* Name input */}
          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700 mb-1 block">Ton prénom</span>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ex: Alice"
              maxLength={20}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Color picker */}
          <div className="mb-6">
            <span className="text-sm font-medium text-gray-700 mb-3 block">Ta couleur</span>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setUserColor(color)}
                  className="w-9 h-9 rounded-full transition-transform hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: color,
                    outline: userColor === color ? `3px solid ${color}` : 'none',
                    outlineOffset: '2px',
                  }}
                  aria-label={`Couleur ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: userColor }}
            >
              {(userName || '?').charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-800">{userName || 'Ton nom ici'}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (userName.trim()) setScreen('group');
            }}
            disabled={!userName.trim()}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg shadow-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continuer
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Screen: Group ────────────────────────────────────────────────────────
  if (screen === 'group') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <button
            type="button"
            onClick={() => setScreen('profile')}
            className="flex items-center gap-1 text-gray-500 mb-6 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rejoindre / Créer</h2>
          <p className="text-gray-500 mb-6">Rejoins un groupe existant ou crée le tien.</p>

          {/* Create */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateGroup}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl text-lg shadow-md hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Créer un groupe
          </motion.button>

          {/* Join */}
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="font-semibold text-gray-800 mb-3">Rejoindre avec un code</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              placeholder="Ex : AB12"
              maxLength={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {joinError && <p className="text-red-500 text-sm mb-2">{joinError}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleJoinGroup}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Rejoindre
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Screen: Settings ─────────────────────────────────────────────────────
  if (screen === 'settings') {
    const modeInfo: Record<'demo' | 'local' | 'supabase', { label: string; desc: string; icon: React.ReactNode }> = {
      demo: {
        label: 'Démo',
        desc: "Membres fictifs pour tester l'interface",
        icon: <Play className="w-5 h-5" />,
      },
      local: {
        label: 'Local (même réseau)',
        desc: 'Utilise BroadcastChannel — onglets du même navigateur',
        icon: <Smartphone className="w-5 h-5" />,
      },
      supabase: {
        label: 'Supabase (production)',
        desc: 'Synchronisation en temps réel via Supabase Realtime',
        icon: <Globe className="w-5 h-5" />,
      },
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setScreen('map')}
            className="flex items-center gap-1 text-gray-500 mb-6 hover:text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour à la carte
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h2>

          {/* Profile summary */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: userColor }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <button
                type="button"
                onClick={() => setScreen('profile')}
                className="text-sm text-blue-500 hover:underline"
              >
                Modifier le profil
              </button>
            </div>
          </div>

          {/* Mode selector */}
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="font-semibold text-gray-900 mb-3">Mode de partage</p>
            <div className="space-y-2">
              {(Object.keys(modeInfo) as Array<'demo' | 'local' | 'supabase'>).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    mode === m
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      mode === m ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {modeInfo[m].icon}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{modeInfo[m].label}</p>
                    <p className="text-xs text-gray-500">{modeInfo[m].desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Group info */}
          {groupCode && (
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <p className="font-semibold text-gray-900 mb-2">Groupe actuel</p>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 font-mono text-lg tracking-widest text-gray-900">
                  {groupCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleLeaveGroup}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Quitter le groupe
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Screen: Map ──────────────────────────────────────────────────────────
  const mapCenter: [number, number] | undefined = selectedMember
    ? [selectedMember.lat, selectedMember.lng]
    : sharing.myPosition
      ? [sharing.myPosition.lat, sharing.myPosition.lng]
      : undefined;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-200">
      {/* Map fills the entire viewport */}
      <MapView
        members={allMembers}
        onMemberClick={handleMemberClick}
        center={mapCenter}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe-top pb-2 pt-4 bg-gradient-to-b from-black/30 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">{groupName || groupCode}</span>
          {sharing.isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            title="Partager le code"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            title="Informations"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScreen('settings')}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bottom panel: member list ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Toggle button */}
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
          >
            {showMembers ? (
              <>
                <EyeOff className="w-4 h-4" />
                Masquer
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                {allMembers.length} membre{allMembers.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showMembers && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl px-4 pb-safe-bottom pb-6 pt-4 max-h-64 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">
                  <Users className="w-4 h-4 inline mr-1" />
                  Membres ({allMembers.length})
                </h3>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {mode === 'demo' ? '🎭 Démo' : mode === 'local' ? '📡 Local' : '☁️ Supabase'}
                </span>
              </div>

              {allMembers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  Aucun membre pour l'instant. Partagez le code du groupe !
                </p>
              ) : (
                <div className="space-y-1">
                  {allMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onClick={handleMemberClick}
                      isSelected={selectedMember?.id === member.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Info modal ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-6"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Code du groupe</h3>
                <button
                  type="button"
                  onClick={() => setShowInfo(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Partagez ce code avec vos proches pour qu'ils rejoignent votre groupe.
              </p>

              <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-4 mb-4">
                <code className="flex-1 text-3xl font-bold font-mono tracking-widest text-blue-700 text-center">
                  {groupCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Mode actif :{' '}
                <span className="font-semibold">
                  {mode === 'demo' ? 'Démo' : mode === 'local' ? 'Local' : 'Supabase'}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
