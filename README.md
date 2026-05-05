# Gennaker

Application web de génération et d'impression d'évaluations théoriques pour la formation aux brevets fédéraux de voile.

**Stack** : SvelteKit · Cloudflare Workers + D1 + R2 · Drizzle ORM · Tailwind CSS · TypeScript

---

## Prérequis

- **Node.js 22** — voir `.node-version`. Si tu utilises `fnm` ou `nvm`, la version est automatiquement sélectionnée.
- **wrangler** (Cloudflare CLI) — installé comme dépendance de développement, accessible via `npx wrangler`.

## Installation

```bash
npm install
```

## Setup local (sans compte Cloudflare)

Le développement local fonctionne entièrement sans compte Cloudflare. La base de données D1 tourne en SQLite local via wrangler.

```bash
npm run db:migrate:local   # créer les tables
npm run dev                # lancer le serveur (http://localhost:5173)
```

Voir [docs/dev-setup.md](docs/dev-setup.md) pour le détail complet : configuration de `.dev.vars`, import de données depuis un export de prod, variante `dev:cf`, scripts de debug R2.

## Modifier le schéma de base de données

Éditer [src/lib/server/db/schema.ts](src/lib/server/db/schema.ts) puis :

```bash
npm run db:generate      # génère un nouveau fichier SQL dans drizzle/migrations/
npm run db:migrate:local # applique en local
```

## Tests

```bash
npm run test          # tests unitaires (domaine)
npm run test:watch    # mode watch
npm run test:int      # tests d'intégration (nécessite wrangler)
```

## Build

```bash
npm run build
npm run preview
```

---

## Setup production (avec compte Cloudflare)

Voir [docs/production-setup.md](docs/production-setup.md) pour le guide complet : création des ressources Cloudflare, configuration des secrets, bootstrap du premier admin, import de données, déploiement continu.

---

## Structure du projet

```
src/
├── lib/
│   ├── domain/          # logique métier pure (TypeScript, sans dépendances)
│   ├── server/
│   │   └── db/          # schéma Drizzle, connexion D1, requêtes
│   └── components/      # composants Svelte réutilisables
└── routes/              # pages et routes API SvelteKit
drizzle/migrations/      # migrations SQL générées par Drizzle Kit
scripts/                 # import depuis export de production
```

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour l'architecture détaillée et [STANDARDS.md](STANDARDS.md) pour les conventions de code.
