# Architecture — Gennaker

## 1. Vue d'ensemble

Gennaker est une application web full-stack construite avec SvelteKit, déployée entièrement sur l'infrastructure Cloudflare. Le framework gère à la fois le rendu des pages (SSR) et les routes API via Cloudflare Workers. La base de données est Cloudflare D1 (SQLite edge), accédée via Drizzle ORM. Les images sont stockées dans Cloudflare R2.

```
Navigateur
    │
    ▼
Cloudflare Pages + Workers (SvelteKit SSR + API routes)
    │
    ├── Cloudflare D1 (SQLite)
    │     └── questions, templates, évaluations partagées, soumissions
    │
    └── Cloudflare R2
          └── images des questions (egress gratuit)
```

Tout l'hébergement est chez **Cloudflare**. Le coût est nul dans les limites du free tier, largement suffisant pour le trafic attendu (100 000 requêtes Workers/jour, 5 GB D1, 10 GB R2).

---

## 2. Stack technique

| Couche | Choix | Rôle |
|--------|-------|------|
| Framework | SvelteKit + TypeScript | SSR, routing, API routes, état client |
| Adaptateur | `@sveltejs/adapter-cloudflare` | Compile SvelteKit pour Cloudflare Workers |
| Styling | Tailwind CSS | UI + styles d'impression (`@media print`) |
| Base de données | Cloudflare D1 (SQLite) | Persistance principale, edge |
| ORM | Drizzle (dialect SQLite) | Schéma typé, migrations, requêtes |
| Object storage | Cloudflare R2 | Images des questions (egress gratuit) |
| Hébergement | Cloudflare Pages + Workers | SSR + API, déploiement via `wrangler` |
| Emails | Resend | Notifications admin (free tier : 3 000/mois) |
| IDs courts | nanoid | Codes des liens de partage |
| Auth | bcryptjs + HMAC-SHA256 | Hachage mdp + sessions multi-admin signées (table `admins` en D1) |

---

## 3. Structure du projet

```
gennaker/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts        -- schéma Drizzle (source de vérité)
│   │   │   │   ├── index.ts         -- connexion D1 via binding Cloudflare
│   │   │   │   └── queries/         -- requêtes réutilisables par domaine
│   │   │   ├── services/
│   │   │   │   ├── draw.ts          -- logique de tirage des questions
│   │   │   │   ├── share.ts         -- création/lecture des liens partagés
│   │   │   │   └── storage.ts       -- upload/suppression images R2
│   │   │   └── auth.ts              -- vérification session admin
│   │   ├── components/              -- composants Svelte réutilisables
│   │   └── types.ts                 -- types partagés client/serveur
│   │
│   └── routes/
│       ├── +page.svelte             -- accueil : choix support × format
│       ├── evaluation/
│       │   └── +page.svelte         -- évaluation en cours (générée, modifiable)
│       ├── e/[code]/
│       │   └── +page.svelte         -- évaluation partagée (lecture seule)
│       ├── questions/
│       │   └── +page.svelte         -- banque publique de questions
│       ├── soumettre/
│       │   └── +page.svelte         -- formulaire soumission/signalement
│       ├── admin/
│       │   ├── +layout.server.ts    -- garde d'authentification admin
│       │   ├── login/               -- formulaire email + mot de passe
│       │   ├── profile/             -- changement de mot de passe
│       │   ├── admins/              -- gestion des comptes (super_admin uniquement)
│       │   ├── questions/           -- CRUD questions
│       │   ├── templates/           -- gestion des templates d'évaluation
│       │   └── moderation/          -- file soumissions + signalements
│       └── api/
│           ├── evaluation/
│           │   ├── generate/+server.ts   -- tirage des questions
│           │   └── share/+server.ts      -- persistance d'un lien de partage
│           └── submissions/
│               └── +server.ts            -- réception des soumissions
│
├── drizzle/
│   └── migrations/                  -- fichiers SQL générés par Drizzle Kit
│
├── scripts/
│   └── import-export.ts             -- peuplement D1 + R2 depuis un export ZIP de production
│
├── static/                          -- assets statiques (favicon, etc.)
├── wrangler.toml                    -- configuration Cloudflare (bindings D1, R2, secrets)
├── SPEC.md
├── ARCHITECTURE.md
└── drizzle.config.ts
```

---

## 4. Authentification

L'interface admin utilise une authentification par email + mot de passe (bcrypt, coût 10), avec sessions signées en cookie HTTP-only (HMAC-SHA256, TTL 7 jours). Les admins sont stockés dans la table `admins` en D1.

Deux rôles : `admin` (contenu) et `super_admin` (contenu + gestion des comptes). À chaque requête, un SELECT par PK vérifie que l'admin existe encore — un admin supprimé voit sa session invalidée immédiatement.

Voir [`docs/auth.md`](docs/auth.md) pour le détail de l'implémentation, le bootstrap et les procédures d'urgence.

---

## 5. Modèle de données

Le schéma complet est défini dans `src/lib/server/db/schema.ts` avec le dialect SQLite de Drizzle. Les types D1-spécifiques : `integer` avec autoincrement (au lieu de `serial`), `text` pour les JSON stockés (au lieu de `jsonb`), `text` pour les tableaux sérialisés en JSON (au lieu de `text[]`).

### Administrateurs

```typescript
admins: {
  id                   integer PK autoincrement
  email                text unique              -- identifiant de login
  first_name           text
  last_name            text
  password_hash        text                     -- bcrypt coût 10
  role                 text                     -- 'admin' | 'super_admin'
  created_at           integer                  -- timestamp Unix
  updated_at           integer
  last_login_at        integer nullable
  must_change_password integer                  -- 0/1, forcé à la première connexion
}
```

### Supports

```typescript
supports: {
  id            integer PK autoincrement
  slug          text unique   -- 'deriveur' | 'catamaran' | 'windsurf' | 'croisiere'
  display_name  text
  enabled       integer       -- 0 = désactivé (croisiere en v1), 1 = actif
}
```

### Contenu (catégories → sections → questions)

```typescript
categories: {
  id                  integer PK autoincrement
  slug                text unique
  display_name        text
  applicable_supports text      -- JSON stringifié : '[]' = tous les supports
}

sections: {
  id                  integer PK autoincrement
  category_id         FK → categories
  slug                text
  display_name        text
  applicable_supports text      -- JSON stringifié : '[]' = tous les supports
  UNIQUE(category_id, slug)     -- garantit l'idempotence de l'import
}

questions: {
  id                  integer PK autoincrement
  section_id          FK → sections
  title               text                       -- titre court, une ligne
  question_md         text                       -- énoncé en markdown
  correction_md       text                       -- correction en markdown
  difficulty          text                       -- 'facile' | 'moyen' | 'difficile'
  answer_size         text                       -- 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  applicable_supports text                       -- JSON stringifié : '[]' = tous
  status              text                       -- 'brouillon' | 'publie'
  source_md           text
  created_at          integer                    -- timestamp Unix
  updated_at          integer
}

```

### Templates d'évaluation

```typescript
evaluation_templates: {
  id           integer PK autoincrement
  support_slug text FK → supports.slug
  format       text      -- 'standard' | 'raccourcie' | 'positionnement'
  created_at   integer
  updated_at   integer
  UNIQUE(support_slug, format)  -- garantit l'idempotence de l'import
}

template_slots: {
  id                     integer PK autoincrement
  template_id            FK → evaluation_templates
  section_id             FK → sections
  position               integer
  question_count         integer
  difficulty_filter      text     -- 'any' | 'facile' | 'moyen' | 'difficile'
  pinned_question_id     FK → questions (nullable)
  preferred_question_ids text     -- JSON stringifié : '[42, 17]'
  UNIQUE(template_id, position)  -- garantit l'idempotence de l'import
}
```

### Évaluations partagées

```typescript
shared_evaluations: {
  id           integer PK autoincrement
  short_code   text unique   -- généré par nanoid, ex : "x7kQp2"
  support_slug text
  format       text
  slots_json   text          -- JSON stringifié : [{section_id, question_ids[], pinned_ids[]}]
  created_at   integer
  expires_at   integer       -- timestamp Unix, null = permanent (v2)
}
```

### Journal d'audit

```typescript
audit_logs: {
  id           integer PK autoincrement
  admin_id     FK → admins (nullable, SET NULL si admin supprimé)
  action       text      -- 'question.create' | 'question.update' | 'question.delete'
               --           'submission.approve' | 'submission.reject'
               --           'report.resolve' | 'report.reopen'
  target_type  text      -- 'question' | 'submission' | 'report'
  target_id    integer   -- nullable
  metadata     text      -- JSON : { before, after } pour questions ; { context } pour les autres
  ip_address   text      -- nullable
  created_at   integer
}
```

Index : `admin_id`, `created_at`.

### Soumissions communautaires

```typescript
community_submissions: {
  id                   integer PK autoincrement
  type                 text      -- 'nouvelle_question' | 'correction'
  section_id           FK → sections (nullable)
  question_id          FK → questions (nullable)
  title                text
  question_md          text
  correction_md        text
  source_md            text
  problem_description  text
  submitter_email      text
  status               text      -- 'en_attente' | 'approuve' | 'rejete'
  created_at           integer
  reviewed_at          integer
}
```

---

## 5. Flux de données principaux

### Génération d'une évaluation

```
1. Client : GET /api/evaluation/generate?support=deriveur&format=standard
2. Serveur (Worker) :
   a. Charge le template (support × format) avec ses slots depuis D1
   b. Pour chaque slot, appelle le service de tirage (draw.ts) :
      - Filtre les questions : status='publie', applicable_supports ⊇ support (ou vide)
      - Applique le filtre de difficulté du slot (avec fallback si banque insuffisante)
      - Si pinned_question_id : inclut la question épinglée, complète avec count-1 tirages
      - Sinon si preferred_question_ids : tire en priorité dans cette liste, complète si besoin
      - Exclut les questions déjà tirées dans d'autres slots (avec avertissement si impossible)
   c. Retourne l'évaluation complète
3. Client : stocke l'état dans un store Svelte mutable
```

### Partage d'une évaluation

```
1. Client : POST /api/evaluation/share
   Body : { support, format, slots: [{section_id, question_ids, pinned_ids}] }
2. Serveur :
   a. Génère un short_code via nanoid
   b. Calcule expires_at = now + 30 jours (timestamp Unix)
   c. Insère dans shared_evaluations (D1)
   d. Retourne { short_code, url, expires_at }
3. Client : affiche le lien, pose un flag "partagé" sur l'état courant
   → toute modification ultérieure affiche le bandeau d'avertissement
```

### Consultation d'un lien partagé

```
1. GET /e/[code] → load() SvelteKit côté serveur (Worker)
2. Recherche le short_code dans D1
3. Si inexistant ou expires_at dépassé → rendu de la page d'erreur explicite
4. Charge les questions par leurs IDs (parsing slots_json)
5. Rendu SSR complet, imprimable sans JavaScript
```

### Soumission communautaire

```
1. Client : POST /api/submissions
   Body : { type, section_id?, question_id?, title?, question_md?, correction_md?,
            problem_description?, source_md?, submitter_email? }
2. Serveur :
   a. Vérifie le honeypot et le rate limiting (par IP, via Workers)
   b. Insère en D1 avec status='en_attente'
   c. Envoie un email de notification à l'admin via Resend API
   d. Retourne 201
```

---

## 6. Authentification admin

Pas de bibliothèque d'authentification externe. Un seul compte admin.

- **Login** : formulaire mot de passe → vérification via `bcryptjs` → création d'un cookie de session signé (HttpOnly, Secure, SameSite=Strict)
- **Protection** : `admin/+layout.server.ts` → vérifie le cookie à chaque requête → redirect `/admin/login` si absent ou invalide
- **Secrets** : `ADMIN_PASSWORD_HASH` et `ADMIN_SESSION_SECRET` déclarés comme secrets Cloudflare Workers (`wrangler secret put`)

`bcryptjs` est utilisé à la place de `bcrypt` : implémentation pure JavaScript, compatible avec l'environnement Workers (pas d'accès aux modules natifs Node.js).

---

## 7. Gestion des images

Les images référencées dans le markdown des questions sont stockées dans Cloudflare R2.

### Convention de référencement

Dans `question_md` et `correction_md`, les images utilisent des **URLs relatives** :

```markdown
![alt](images/schema.png)
```

### Clé R2 — mapping déterministe

```
{questionId}/images/{filename}
```

Exemple : `42/images/schema.png`

La clé dépend uniquement de l'ID de la question — stable même si la question change de catégorie/section. Il n'existe pas de table catalogue : pour connaître ou supprimer les images d'une question, on parse ses champs markdown et on reconstruit les clés R2.

### Résolution au rendu

`createMarkdownRenderer(questionId, r2BaseUrl)` (`src/lib/markdown.ts`) transforme `images/{fn}` → `${r2BaseUrl}/${questionId}/images/${fn}`. `r2BaseUrl` provient de `platform.env.R2_PUBLIC_URL` (exposé par `src/routes/+layout.server.ts`).

### Export ZIP

Les clés R2 sont plates mais le ZIP d'export (`GET /admin/export`) reconstruit la hiérarchie `{cat}/{sec}/{id}/images/{fn}` en résolvant la question depuis la DB — les fichiers markdown et images restent co-localisés dans le ZIP.

### Upload

Via le binding R2 natif dans Workers (`env.IMAGES`) — pas de clés S3. La clé est calculée côté serveur depuis l'ID de la question.

### Local

En dev, les images sont stockées dans le **R2 local** (miniflare via `platformProxy`) exactement comme en prod. `npm run db:seed:local` injecte les images dans le R2 local via `wrangler r2 object put --local`. La route `GET /r2-proxy/[...path]` (`src/routes/r2-proxy/[...path]/+server.ts`) les sert en lisant depuis le binding R2.

```
R2_PUBLIC_URL=/r2-proxy   # dans .dev.vars
```

Pas de dossier `static/questions-images/` — les images ne sont pas servies comme fichiers statiques.

---

## 8. Déploiement Cloudflare

### wrangler.toml

```toml
name = "gennaker"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "gennaker"
database_id = "..."          # obtenu après `wrangler d1 create gennaker`

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "gennaker-questions"

[vars]
R2_PUBLIC_URL = "https://pub-xxx.r2.dev"
ADMIN_EMAIL = "..."
RESEND_API_KEY = "..."       # peut aussi être un secret

# Secrets (via `wrangler secret put`) :
# ADMIN_PASSWORD_HASH
# ADMIN_SESSION_SECRET
```

### CI/CD

Déploiement automatique via **Cloudflare Pages Git integration** : chaque push sur `main` déclenche un build et un déploiement. Les environnements preview (branches) et production (main) sont gérés nativement.

Les migrations D1 sont jouées manuellement ou via un script npm `predeploy` :
```
wrangler d1 migrations apply gennaker --remote
```

---

## 9. Impression

L'impression est déclenchée par `window.print()` depuis le bouton "Imprimer" de la page évaluation.

**Nommage du document** : avant d'appeler `window.print()`, le script met `document.title` à `Evaluation-{support}-{format}-{YYYY-MM-DD}`. Le titre est restauré via l'événement `afterprint`.

**Absence de coupure** : chaque article question porte `break-inside: avoid` (classe Tailwind `break-inside-avoid`). Les titres de catégorie et de section restent attachés au premier article qui suit grâce à `break-after: avoid`.

**Espace de réponse** : un `<div>` invisible à l'écran (`hidden print:block`) est inséré sous l'énoncé de chaque question. Sa hauteur est fixée via `style` inline en fonction du champ `answer_size` de la question :

| `answer_size` | Hauteur |
|---------------|---------|
| `xs`          | 2 rem   |
| `sm`          | 4 rem   |
| `md`          | 6 rem   |
| `lg`          | 10 rem  |
| `xl`          | 14 rem  |

**Éléments masqués à l'impression** : le header (titre, toggles, bouton imprimer) porte `print:hidden`.

**Correction** : la correction s'imprime si et seulement si le toggle "Afficher la correction" est actif au moment de l'impression — aucune logique spécifique, c'est le même rendu DOM que l'écran.

---

## 10. Import depuis un export de production

L'environnement de dev (et la production en cas de restauration) se peuple exclusivement depuis un export ZIP généré par `GET /admin/export`. Il n'existe plus de dépendance à un répertoire de données statiques.

### Script

`scripts/import-export.ts` — orchestrateur CLI, pas de logique métier directe.

### Logique pure (testée unitairement)

| Fichier | Rôle |
|---------|------|
| `src/lib/server/import/parse-zip.ts` | Désarchive le ZIP, parse les `.md`, extrait questions et images |
| `src/lib/server/import/generate-sql.ts` | Génère le SQL d'upsert (`ON CONFLICT DO UPDATE`) et de wipe |

### Flux d'import

```
ZIP → parseZip()
         ├── structure.json → generateStructureSql() → wrangler d1 execute
         ├── questions .md  → generateQuestionsSql() → wrangler d1 execute
         ├── templates.json → generateTemplatesSql() → wrangler d1 execute
         └── images/        → wrangler r2 object put  (un appel par fichier)
```

### Idempotence

Toutes les tables utilisent `ON CONFLICT DO UPDATE` (upsert SQLite). Les tables `sections`, `evaluation_templates` et `template_slots` ont des index uniques composites pour que le `ON CONFLICT` puisse cibler la bonne ligne :

- `sections` → `UNIQUE(category_id, slug)`
- `evaluation_templates` → `UNIQUE(support_slug, format)`
- `template_slots` → `UNIQUE(template_id, position)`

### Comportement dev vs prod

- **`npm run dev:seed`** passe `--wipe` : vide toutes les tables (ordre inverse des FK) puis importe. Repart toujours d'un état propre.
- **`npm run prod:seed`** sans `--wipe` : upsert pur, aucune donnée supprimée. Sûr pour rattraper un diff ou restaurer.

### Format du ZIP d'export

```
{cat}/{sec}/{id}/{titre}.md     ← question + correction (+ <small>source</small> si présent)
{cat}/{sec}/{id}/images/{fn}    ← images
templates.json                  ← templates et slots
structure.json                  ← supports, catégories, sections
```

Voir [docs/admin-export.md](docs/admin-export.md) et [docs/dev-setup.md](docs/dev-setup.md).

---

## 11. Variables et secrets

### Déclarés dans wrangler.toml (`[vars]`)
```
R2_PUBLIC_URL        # domaine public du bucket R2
ADMIN_EMAIL          # destinataire des notifications
RESEND_API_KEY       # clé API Resend
LOG_LEVEL            # niveau de log : 'info' (défaut) | 'verbose' | 'debug'
```

### Secrets Workers (`wrangler secret put`)
```
ADMIN_PASSWORD_HASH  # hash bcryptjs du mot de passe admin
ADMIN_SESSION_SECRET # secret pour signer le cookie de session
```

### Bindings (pas des variables, déclarés dans wrangler.toml)
```
DB      → Cloudflare D1 (accès via env.DB dans les Workers)
IMAGES  → Cloudflare R2 (accès via env.IMAGES dans les Workers)
```

---

## 12. Observabilité

### Logger

Le système de logging est défini dans `src/lib/server/logger/` :

```
src/lib/server/logger/
├── types.ts             # Interfaces Logger, LoggerAdapter, LogContext, LogLevel
├── index.ts             # Factory createConsoleLogger() + placeholder Logflare
└── console-logger.ts    # ConsoleAdapter : JSON structuré → console (Workers Logs natifs)
```

Le `Logger` est injecté dans `event.locals.logger` par le hook global (`src/hooks.server.ts`). Un `requestId` UUID est généré par requête et propagé dans chaque entrée de log.

L'architecture est découplée : l'interface `LoggerAdapter` permet de brancher un backend alternatif (ex. Logflare) sans toucher au code métier. Voir le commentaire dans `index.ts` pour le contrat d'implémentation.

### Niveaux de log (`LOG_LEVEL`)

| Niveau | Contenu |
|--------|---------|
| `info` (défaut) | C/U/D des objets métiers (questions, soumissions, signalements, import, export) + toutes les erreurs (R2, sessions invalides, login échoué, 4xx API, 5xx) |
| `verbose` | Tout `info` + génération/retirage d'évaluation (support, format, durée) |
| `debug` | Non implémenté — réservé pour le log de chaque requête HTTP |

### Voir les logs

En dev local (`npm run dev` / `npm run dev:cf`), les entrées JSON structurées apparaissent directement dans le terminal du serveur — `{ ts, level, message, requestId, ...ctx }`.

En production, via le dashboard Cloudflare (Workers & Pages → Logs) ou en temps réel :

```bash
wrangler tail --format=pretty
```

### Basculer vers Logflare

Implémenter un adapter conforme à `LoggerAdapter` (voir commentaire dans `index.ts`) et l'instancier dans `src/hooks.server.ts` à la place du `ConsoleAdapter`. Ajouter les bindings CF `LOGFLARE_API_KEY` (secret) et `LOGFLARE_SOURCE_ID` (var), et appeler via `platform.context.waitUntil(adapter.send(...))` pour ne pas bloquer la réponse.
