# Setup de l'environnement de dev

## Prérequis

- Node.js 22 (`fnm` ou `nvm` la sélectionneront automatiquement via `.node-version`)
- `npm install` effectué

## Étapes

```bash
# 1. Créer les tables
npm run db:migrate:local

# 2. Peupler depuis un export de production
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip

# 3. Lancer le serveur de dev
npm run dev
```

Le serveur tourne sur [http://localhost:5173](http://localhost:5173).

## Obtenir un fichier d'export

L'export ZIP se télécharge depuis l'interface admin en production : `/admin` → **Télécharger le backup**.

Format du fichier : `gennaker-backup-YYYY-MM-DD.zip` (voir [admin-export.md](admin-export.md) pour le détail du contenu).

## Sous-commandes disponibles

Pour importer une partie seulement du backup :

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

La commande est idempotente : la relancer avec le même fichier ne duplique pas les données (SQLite upsert `ON CONFLICT DO UPDATE`).

## Equivalents production

```bash
# Peupler l'environnement de production (après une migration de schéma par ex.)
npm run prod:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```
