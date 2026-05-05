# Setup de l'environnement de dev

## Prérequis

- Node.js 22 (`fnm` ou `nvm` la sélectionneront automatiquement via `.node-version`)
- `npm install` effectué

## Configurer `.dev.vars`

Créer un fichier `.dev.vars` à la racine du projet avec les variables suivantes :

```bash
# Clé HMAC pour signer les tokens de session admin — générer avec :
# openssl rand -hex 32
ADMIN_SESSION_SECRET=<valeur générée>

# URL publique du bucket R2 local (ne pas modifier)
R2_PUBLIC_URL=/r2-proxy
```

Ce fichier est chargé par Wrangler et injecté dans le Worker au démarrage (`npm run dev:cf`). Il est l'équivalent local des secrets configurés avec `wrangler secret put` en production.

## Configurer `.env.local`

Créer un fichier `.env.local` à la racine du projet avec les variables suivantes :

```bash
# Token de session admin — généré une fois depuis /admin/login (cookie admin_session)
ADMIN_SESSION_TOKEN=<valeur du cookie admin_session>

# URL locale du serveur de dev (défaut : http://localhost:5173 pour npm run dev)
# Mettre http://localhost:8787 si on utilise npm run dev:cf
# IMPORT_LOCAL_URL=http://localhost:8787

# URL de l'app de production (pour les imports --remote)
IMPORT_REMOTE_URL=https://gennaker.pages.dev
```

**Comment obtenir `ADMIN_SESSION_TOKEN`** : se connecter sur l'instance de production (`/admin/login`), puis copier la valeur du cookie `admin_session` depuis les DevTools du navigateur (Onglet Application → Cookies). Ce token est valable 7 jours.

## Étapes

```bash
# 1. Créer les tables
npm run db:migrate:local

# 2. Lancer le serveur de dev (requis pour le seed — l'import passe par l'endpoint HTTP)
npm run dev

# 3. Dans un autre terminal : peupler depuis un export de production
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```

Le serveur tourne sur [http://localhost:5173](http://localhost:5173).

## Obtenir un fichier d'export

L'export ZIP se télécharge depuis l'interface admin en production : `/admin` → **Télécharger le backup**.

Format du fichier : `gennaker-backup-YYYY-MM-DD.zip` (voir [admin-export.md](admin-export.md) pour le détail du contenu).

## Sous-commandes disponibles

Pour importer une partie seulement du backup (le serveur de dev doit être lancé) :

```bash
# Structure uniquement (supports, catégories, sections)
npm run dev:seed -- --file backup.zip --only=structure

# Questions uniquement
npm run dev:seed -- --file backup.zip --only=questions

# Templates uniquement
npm run dev:seed -- --file backup.zip --only=templates

# Images uniquement (vers R2 local)
npm run dev:seed -- --file backup.zip --only=images
```

## Idempotence

La commande est idempotente : la relancer avec le même fichier ne duplique pas les données (Drizzle upsert `onConflictDoUpdate`).

## Après une migration de schéma locale

`npm run db:migrate:local` peut créer un nouveau fichier SQLite miniflare (le hash du fichier dépend de la version de miniflare et de la config). Le serveur de dev bascule alors sur ce fichier vide. Si les questions ont disparu après une migration, relancer le seed complet (serveur de dev démarré) :

```bash
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```

## Inspecter le R2 local

Wrangler n'expose pas de commande `list` — passer par le SQLite miniflare directement :

Utiliser les scripts dédiés dans `scripts/dev/` :

```bash
# Lister les images d'une question (remplacer 1 par l'id voulu)
NODE_OPTIONS=--experimental-sqlite npx tsx scripts/dev/r2-list.ts 1

# Lister toutes les clés R2
NODE_OPTIONS=--experimental-sqlite npx tsx scripts/dev/r2-list.ts
```

## Équivalents production

```bash
# Peupler l'environnement de production (après une migration de schéma par ex.)
npm run prod:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```
