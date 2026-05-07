# Setup de l'environnement de production

## Prérequis

- Compte Cloudflare avec wrangler authentifié :
  ```bash
  npx wrangler login
  ```
- Repo GitHub connecté à Cloudflare Pages (voir section [Connecter le repo](#connecter-le-repo-github-à-cloudflare-pages))

## Étape 1 — Créer les ressources Cloudflare

```bash
npx wrangler d1 create gennaker
npx wrangler r2 bucket create gennaker-questions
```

Copier le `database_id` retourné par la première commande dans `wrangler.toml`.

## Étape 2 — Activer l'accès public au bucket R2

Les images doivent être accessibles depuis le navigateur. Deux options :

- **URL `r2.dev`** (la plus simple) — Dashboard Cloudflare → R2 → `gennaker-questions` → *Settings* → *Public Access* → *Allow Access*. Une URL `https://pub-xxxx.r2.dev` est générée.
- **Domaine personnalisé** (recommandé en production) — même onglet, attacher un sous-domaine (ex. `images.monsite.com`). Cloudflare déconseille `r2.dev` pour un usage à fort trafic.

## Étape 3 — Configurer `wrangler.toml`

Renseigner les variables dans la section `[vars]` :

```toml
[vars]
R2_PUBLIC_URL = "https://pub-xxxx.r2.dev"   # ou domaine personnalisé
```

## Étape 4 — Appliquer le schéma DB

```bash
npm run db:migrate:remote
```

## Étape 5 — Configurer les secrets Wrangler

```bash
# Générer une clé aléatoire
openssl rand -hex 32

# La pousser comme secret Cloudflare
npx wrangler secret put ADMIN_SESSION_SECRET
```

## Étape 6 — Créer le premier super_admin

```bash
npx tsx scripts/seed-admin.ts \
  --email admin@example.com \
  --first-name Alice \
  --last-name Martin \
  --password <mot_de_passe_min_8_chars> \
  --remote
```

Le script refuse de s'exécuter si un `super_admin` existe déjà. Pour les admins suivants, utiliser l'interface `/admin/admins`. Voir [auth.md](auth.md) pour le reset d'urgence.

## Étape 7 — (Optionnel) Importer des données depuis un export

Prérequis : avoir un `ADMIN_SESSION_TOKEN` valide dans `.env.local`. Pour l'obtenir, se connecter sur l'instance prod, puis copier la valeur du cookie `admin_session` depuis les DevTools (Onglet Application → Cookies). Voir [dev-setup.md — Configurer `.env.local`](dev-setup.md#configurer-env-local) pour le détail.

```bash
npm run prod:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```

L'export ZIP se télécharge depuis l'interface admin : `/admin` → **Télécharger le backup**. Voir [admin-export.md](admin-export.md) pour le format et les sous-commandes disponibles.

## Connecter le repo GitHub à Cloudflare Pages

Dans le dashboard Cloudflare → Workers & Pages → Create → connecter le repo GitHub.

Paramètres de build :

| Champ | Valeur |
|-------|--------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node.js version | `22` |

Aucun token API custom n'est nécessaire : `wrangler deploy` utilise l'authentification injectée automatiquement par Cloudflare.

Le déploiement est ensuite automatique à chaque push sur `master`.

## Configurer un domaine personnalisé

Par défaut, l'application est accessible sur `gennaker.[user].workers.dev`. Pour utiliser votre propre domaine :

1. **Configurer les DNS** chez votre registrar :
   - **Méthode CNAME** (recommandée) : `CNAME @ gennaker.[user].workers.dev` ou `CNAME www gennaker.[user].workers.dev`
   - **Méthode A/AAAA** : utiliser les IPs fournies par Cloudflare dans le dashboard

2. **Ajouter le domaine dans Cloudflare Workers** :
   - Dashboard → Workers & Pages → sélectionner `gennaker`
   - Onglet *Custom domains* → *Set up a custom domain*
   - Saisir votre domaine (ex : `gennaker.example.com`)
   - Cloudflare génère automatiquement le certificat SSL (quelques minutes)

3. **Mettre à jour la variable d'import** (optionnel) :
   Si vous utilisez `npm run prod:seed` depuis un environnement local, ajoutez dans `.env.local` :
   ```bash
   IMPORT_REMOTE_URL=https://votre-domaine.com
   ```

Aucune modification du code source n'est nécessaire — les URLs de l'application sont relatives.

## Déploiements suivants

Après chaque changement de schéma, appliquer la migration **avant** de pousser le code :

```bash
npm run db:migrate:remote
```

## Logs en production

```bash
npx wrangler tail --format=pretty
```

Les logs sont également accessibles via le dashboard Cloudflare → Workers & Pages → Logs.
