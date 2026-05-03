# ProcheTracker SaaS

Localisez vos proches en temps réel grâce à des groupes sécurisés par code.  
Application React + TypeScript construite avec **Vite**, **Tailwind CSS**, **framer-motion**, **Leaflet** et **Supabase Realtime**.

---

## Prérequis

- Node.js 18+
- npm 9+

## Installation et lancement

```bash
# 1. Installer les dépendances
npm install

# 2. (Optionnel) Configurer Supabase
cp .env.example .env
# Éditez .env pour renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Démarrer le serveur de développement
npm run dev

# 4. Build de production
npm run build
```

## Configuration Supabase

L'application supporte trois modes de partage de position :

| Mode | Description |
|------|-------------|
| `demo` | Membres fictifs pour tester l'interface (aucune config requise) |
| `local` | BroadcastChannel — fonctionne entre onglets du même navigateur |
| `supabase` | Synchronisation en temps réel via Supabase Realtime |

Pour activer le mode **supabase**, créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Ces variables sont exposées côté client via Vite (`import.meta.env`).  
Sans ces variables, le mode supabase est désactivé et les modes `demo` / `local` restent disponibles.

## Structure du projet

```
src/
├── App.tsx                   # Composant principal (5 écrans)
├── main.tsx                  # Point d'entrée React
├── index.css                 # Tailwind + styles globaux
├── components/
│   ├── MapView.tsx           # Carte Leaflet/OpenStreetMap
│   └── MemberCard.tsx        # Carte d'un membre du groupe
├── hooks/
│   ├── useGeolocation.ts     # Suivi GPS (watchPosition)
│   └── useLocationSharing.ts # Partage de position (demo/local/supabase)
├── lib/
│   └── supabase.ts           # Client Supabase + helpers localStorage
└── types/
    └── index.ts              # Types TypeScript partagés
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (HMR) |
| `npm run build` | Build de production TypeScript + Vite |
| `npm run preview` | Prévisualiser le build de production |
| `npm run lint` | Linter ESLint |

## Intégration Lovable

Ce projet est conçu pour être importé dans [Lovable](https://lovable.dev/).  
Assurez-vous que les variables d'environnement Supabase sont configurées dans les paramètres du projet Lovable.
