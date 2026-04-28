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
# 1. Créer les tables (migration de schéma)
npm run db:migrate:local

# 2. (Optionnel) Avoir des données et des images qui s'affichent
npm run db:seed:local

# 3. Lancer le serveur de dev
npm run dev
```

> `npm run db:seed:local` génère le SQL depuis `archive/`, peuple D1, **et** copie les images
> dans `static/questions-images/{cat}/{sec}/{id}/images/`. Le renderer local résout les URLs
> relatives (`images/schema.png`) via `R2_PUBLIC_URL=/questions-images` — à ajouter dans
> `.dev.vars` (voir ci-dessous).

Le serveur tourne sur [http://localhost:5173](http://localhost:5173).

`npm run dev` utilise `vite dev` avec `platformProxy` (`@sveltejs/adapter-cloudflare`) : les bindings D1, R2 et les variables d'environnement de `.dev.vars` sont injectés automatiquement, et le HMR fonctionne normalement.

> **Sans l'étape 2**, les questions sont en base mais les images ne s'affichent pas. C'est acceptable pour travailler sur la logique métier.

> **`npm run dev`** (par défaut) — À utiliser pour la majorité du développement : HMR CSS, rechargement rapide, bonne expérience DX. Les bindings Cloudflare (D1, R2) sont simulés via `platformProxy`.
>
> **`npm run dev:cf`** (`vite build --watch + wrangler dev`, port 8788) — Simule l'environnement Workers réel. HMR CSS **ne fonctionne pas**, mais permet de valider des comportements qui diffèrent entre local et production :
> - Limites de **timeout/CPU** (30s pour Workers standard)
> - Limitations de **mémoire** (environ 128 MB)
> - Résolution des **variables d'environnement et secrets** depuis `.dev.vars`
> - Comportement exact de **R2** et **D1** en tant que bindings
>
> À utiliser avant de pusher si tu modifies : un endpoint CPU-intensif (ex. ZIP d'export), des opérations R2 en masse, ou la gestion des secrets/bindings.

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

### Première fois

```bash
# Créer les ressources Cloudflare
npx wrangler d1 create gennaker          # copier le database_id dans wrangler.toml
npx wrangler r2 bucket create gennaker-questions
```

**Activer l'URL publique du bucket R2**

Les images doivent être accessibles publiquement depuis le navigateur. Cloudflare R2 propose deux options :

- **URL `r2.dev` (la plus simple)** — dans le dashboard Cloudflare → R2 → `gennaker-questions` → onglet *Settings* → *Public Access* → *Allow Access*. Une URL de la forme `https://pub-xxxx.r2.dev` est générée. Copier cette URL.
- **Domaine personnalisé** — dans le même onglet, attacher un sous-domaine (ex. `images.monsite.com`). Recommandé en production car Cloudflare déconseille `r2.dev` pour des usages à fort trafic.

> L'API S3 compatible de R2 (endpoint `https://<account>.r2.cloudflarestorage.com`) est réservée à l'accès programmatique (upload/download depuis un Worker ou un script). Elle ne sert pas les fichiers publiquement — n'utilise pas cette URL ici.

Renseigner ensuite les variables dans `wrangler.toml` : `R2_PUBLIC_URL` (l'URL obtenue ci-dessus), `ADMIN_EMAIL`, `RESEND_API_KEY`.

```bash
# Appliquer le schéma
npm run db:migrate:remote

# Uploader les images vers R2
npm run images:remote

# Générer et importer les données (questions + templates)
# (lit R2_PUBLIC_URL depuis wrangler.toml automatiquement)
npm run db:seed:remote

# Configurer les secrets (voir ci-dessous pour générer les valeurs)
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put ADMIN_SESSION_SECRET
```

#### Générer le hash du mot de passe admin

Le mot de passe n'est jamais stocké en clair. Générer le hash bcrypt (cost 12) :

```bash
node -e "require('bcryptjs').hash('MON_MDP', 12).then(console.log)"
```

Copier le hash obtenu et le passer à `wrangler secret put ADMIN_PASSWORD_HASH`.

Pour `ADMIN_SESSION_SECRET`, utiliser une chaîne aléatoire longue :

```bash
openssl rand -hex 32
```

#### Dev local — fichier `.dev.vars`

Créer un fichier `.dev.vars` à la racine (ignoré par git) pour que les secrets soient disponibles avec `npm run dev` (et `npm run dev:cf`) :

```
ADMIN_PASSWORD_HASH=<hash bcrypt>
ADMIN_SESSION_SECRET=<chaîne aléatoire>
R2_PUBLIC_URL=/questions-images
```

### Connecter le repo GitHub à Cloudflare

Dans le dashboard Cloudflare → Workers & Pages → Create → connecter le repo GitHub `Dromadon/gennaker`.

Paramètres de build :

| Champ | Valeur |
|-------|--------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node.js version | `22` |

> Aucun token API custom n'est nécessaire. `wrangler deploy` utilise l'authentification injectée automatiquement par l'environnement de build Cloudflare.

### Déploiement continu

Automatique à chaque push sur `master` via la Git integration.

Pour appliquer de nouvelles migrations de schéma :

```bash
npm run db:migrate:remote
```

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
scripts/                 # scripts one-shot (migration contenu, images)
```

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour l'architecture détaillée et [STANDARDS.md](STANDARDS.md) pour les conventions de code.
