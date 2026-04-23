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
| Auth | bcryptjs | Hash mot de passe admin (pure JS, compatible Workers) |

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
│       │   ├── login/
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
│   └── migrate-content.ts           -- migration one-shot depuis les fichiers existants
│
├── static/                          -- assets statiques (favicon, etc.)
├── wrangler.toml                    -- configuration Cloudflare (bindings D1, R2, secrets)
├── SPEC.md
├── ARCHITECTURE.md
└── drizzle.config.ts
```

---

## 4. Modèle de données

Le schéma complet est défini dans `src/lib/server/db/schema.ts` avec le dialect SQLite de Drizzle. Les types D1-spécifiques : `integer` avec autoincrement (au lieu de `serial`), `text` pour les JSON stockés (au lieu de `jsonb`), `text` pour les tableaux sérialisés en JSON (au lieu de `text[]`).

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
}

questions: {
  id                  integer PK autoincrement
  section_id          FK → sections
  title               text                       -- titre court, une ligne
  question_md         text                       -- énoncé en markdown
  correction_md       text                       -- correction en markdown
  difficulty          text                       -- 'facile' | 'moyen' | 'difficile'
  answer_size         text                       -- 'xs' | 'sm' | 'md' | 'lg'
  applicable_supports text                       -- JSON stringifié : '[]' = tous
  status              text                       -- 'brouillon' | 'publie'
  source_md           text
  created_at          integer                    -- timestamp Unix
  updated_at          integer
}

question_images: {
  id            integer PK autoincrement
  question_id   FK → questions
  filename      text
  storage_url   text          -- URL Cloudflare R2
  in_correction integer       -- 0 | 1
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

- **Nommage** : `questions/{question_id}/{filename}` — stable et prévisible
- **Upload** : depuis l'interface admin, via le binding R2 natif dans Workers (pas besoin de clés S3)
- **Référencement** : dans le markdown, les images utilisent des URLs absolues vers le domaine public R2 (`https://pub-xxx.r2.dev/questions/42/image.png`)
- **Rendu** : le markdown est rendu tel quel — les URLs étant absolues, aucun post-traitement n'est nécessaire
- **Impression** : les images sont incluses normalement dans le CSS print

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

### Environnements

| Env | Branche git | URL |
|-----|-------------|-----|
| Preview | toute branche | `*.gennaker.pages.dev` |
| Production | `main` | `gennaker.bzh` |

---

## 9. Migration du contenu existant

Script one-shot `scripts/migrate-content.ts` exécuté via `wrangler d1 execute` ou localement contre D1 remote.

```
Pour chaque catégorie/section dans public/questions/ :
  1. Lire categoriesDB.json → insérer les entrées categories et sections
  2. Lire db.json de chaque section → récupérer answerSize et applicable_supports
  3. Pour chaque fichier .md :
     a. Extraire le titre (première ligne `# ...`)
     b. Extraire l'énoncé (entre le titre et `# Correction`)
     c. Extraire la correction (après `# Correction`)
     d. Extraire la source (<small>...</small> en fin de correction)
     e. Uploader les images du dossier images/ vers R2 (via API S3 ou wrangler r2)
     f. Remplacer les chemins relatifs des images par les URLs R2 absolues
     g. Insérer la question en D1 avec status='publie', difficulty='moyen'

Pour chaque fichier public/evaluations/*.json :
  1. Parser support × format depuis le nom de fichier
  2. Créer l'evaluation_template correspondant
  3. Créer les template_slots dans l'ordre de la structure JSON
```

---

## 10. Variables et secrets

### Déclarés dans wrangler.toml (`[vars]`)
```
R2_PUBLIC_URL        # domaine public du bucket R2
ADMIN_EMAIL          # destinataire des notifications
RESEND_API_KEY       # clé API Resend
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
