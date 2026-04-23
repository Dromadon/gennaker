# Standards de code — Gennaker

## 1. Architecture logicielle

### Principe général

Architecture en couches pragmatique. Pas de clean architecture formelle, mais le principe central est respecté : **la logique métier est du TypeScript pur, sans dépendance à l'infrastructure**.

### Les quatre couches

```
src/lib/domain/      ← Logique métier pure. Aucune dépendance externe.
src/lib/server/      ← Infrastructure. D1, R2, email. Dépend de Cloudflare.
src/routes/          ← Application. Orchestre domain + server. SvelteKit.
src/lib/components/  ← Présentation. Svelte, état UI. Ne connaît pas le serveur.
```

### Règles inter-couches

| Couche | Peut dépendre de | Ne doit jamais dépendre de |
|--------|-----------------|---------------------------|
| `domain/` | TypeScript stdlib uniquement | Cloudflare, SvelteKit, Drizzle, tout le reste |
| `server/` | `domain/`, Cloudflare, Drizzle | SvelteKit, composants Svelte |
| `routes/` | `domain/`, `server/`, SvelteKit | composants (sauf via `+page.svelte`) |
| `components/` | `$lib/types.ts`, helpers `$lib/` | `server/`, Drizzle, Cloudflare |

**Règle d'or** : une fonction dans `domain/` doit pouvoir tourner dans un test Vitest ordinaire sans aucun setup ni mock.

### Ce que domain/ contient

```
src/lib/domain/
├── draw.ts        -- algorithme de tirage aléatoire des questions
├── evaluation.ts  -- construction et manipulation de l'état d'une évaluation
└── types.ts       -- types domaine (Question, Slot, Evaluation, Support…)
```

Les fonctions de `domain/` sont des **fonctions pures** : même entrée → même sortie (sauf `draw.ts` qui utilise `Math.random()`, mocké dans les tests). Pas d'effet de bord, pas d'I/O.

---

## 2. TypeScript

### Configuration

`tsconfig.json` avec `strict: true`. Aucune exception.

### Règles

- **Pas de `any`**. Utiliser `unknown` et narrower si nécessaire.
- **Pas de `as` sauf** pour les cas où TypeScript ne peut pas inférer et où on est certain du type (documenter pourquoi avec un commentaire).
- **Types explicites** sur les signatures de fonctions exportées. L'inférence est acceptable pour les variables locales.
- **Zod** pour valider toutes les entrées externes : corps de requêtes API, données lues depuis D1 si non typées par Drizzle, params d'URL.
- **Pas de classes** sauf si une bibliothèque tierce l'impose. Fonctions + types + objets littéraux.
- **Pas d'`enum` TypeScript**. Utiliser `const` objects ou des unions de string literals (`'facile' | 'moyen' | 'difficile'`).

```typescript
// ✅ Bon
type Difficulty = 'facile' | 'moyen' | 'difficile'

const DIFFICULTIES = ['facile', 'moyen', 'difficile'] as const
type Difficulty = typeof DIFFICULTIES[number]

// ❌ Mauvais
enum Difficulty { Facile, Moyen, Difficile }
```

### Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers | kebab-case | `draw.ts`, `question-card.svelte` |
| Types / Interfaces | PascalCase | `EvaluationSlot`, `Question` |
| Fonctions | camelCase | `drawQuestions()`, `buildEvaluation()` |
| Variables | camelCase | `currentSlot`, `isLoading` |
| Constantes de module | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Composants Svelte | PascalCase (nom de fichier) | `QuestionCard.svelte` |

### Gestion des erreurs

Les fonctions qui peuvent échouer retournent un **Result type** explicite, pas des exceptions silencieuses.

```typescript
// Dans domain/ et server/ : Result type simple
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

// Dans les routes SvelteKit : utiliser error() de @sveltejs/kit
import { error } from '@sveltejs/kit'
throw error(404, 'Évaluation introuvable')
```

Ne jamais avaler une erreur silencieusement (`catch (e) {}`). Si une erreur est ignorée volontairement, la documenter.

---

## 3. Organisation des fichiers

```
src/
├── lib/
│   ├── domain/
│   │   ├── draw.ts          -- tirage aléatoire
│   │   ├── evaluation.ts    -- construction/mutation d'une évaluation
│   │   └── types.ts         -- types domaine partagés
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts    -- schéma Drizzle (source de vérité)
│   │   │   ├── index.ts     -- connexion D1
│   │   │   └── queries/     -- une fonction par requête, groupées par entité
│   │   │       ├── questions.ts
│   │   │       ├── templates.ts
│   │   │       └── evaluations.ts
│   │   ├── storage.ts       -- upload/suppression images R2
│   │   └── email.ts         -- envoi notifications Resend
│   ├── components/
│   │   ├── evaluation/      -- composants spécifiques à la page évaluation
│   │   ├── questions/       -- composants banque de questions
│   │   └── ui/              -- composants génériques (boutons, modals…)
│   └── utils.ts             -- helpers purs sans logique métier
└── routes/
    └── (voir ARCHITECTURE.md)
```

### Règles fichiers

- **Un fichier = une responsabilité**. Pas de fichiers "utils" fourre-tout qui grossissent indéfiniment.
- **Pas d'`index.ts` barrel files** sauf à la racine de `domain/` et `server/db/`. Les re-exports masquent les dépendances.
- **Imports** : toujours utiliser les alias `$lib/` côté client et serveur. Jamais de chemins relatifs `../../`.

---

## 4. Composants Svelte

### Principes

- **Composants légers** : un composant Svelte gère l'affichage et les interactions locales. La logique métier reste dans `$lib/domain/`.
- **Props typées** : toujours déclarer les props avec des types TypeScript explicites.
- **Pas de logique métier dans les composants**. Si un composant fait un calcul complexe, ce calcul appartient à `$lib/domain/` ou à un helper dans `$lib/`.

```svelte
<script lang="ts">
  // ✅ Le composant reçoit des données déjà traitées
  export let slot: EvaluationSlot
  export let onRedraw: () => void

  // ❌ Le composant ne fait pas de tirage ou de calcul métier
</script>
```

### État global

L'état d'une évaluation en cours (les slots, les questions tirées) vit dans un **store Svelte** dans `src/lib/stores/evaluation.ts`. Les composants lisent et écrivent ce store, pas de prop-drilling profond.

### Styles

- **Tailwind CSS uniquement**. Pas de `<style>` dans les composants sauf exception documentée (ex: animation custom non faisable en Tailwind).
- Les classes d'impression (`print:`, `@media print`) sont gérées dans les composants concernés, pas dans un fichier CSS global.

---

## 5. Tests

### Stack

- **Vitest** : runner universel (domain, server, helpers client)
- **`@cloudflare/vitest-pool-workers`** : pour les tests d'intégration qui touchent D1 ou les Workers
- Pas de Jest, pas de testing-library, pas de Playwright en MVP

### Ce qu'on teste

#### Unitaires — `domain/` (priorité maximale)

Toute la logique de `domain/` est couverte. Les fonctions sont pures, les tests sont triviaux à écrire.

```
src/lib/domain/draw.test.ts
src/lib/domain/evaluation.test.ts
```

Exemples de cas à couvrir pour `draw.ts` :
- tirage respecte le nombre de questions demandées
- tirage filtre les questions par support
- tirage exclut les questions avec statut non `publie`
- tirage se rabat sur toutes les difficultés si la banque est insuffisante au niveau demandé
- tirage avec une banque vide retourne un résultat avec erreur

#### Intégration — routes API (flows complexes uniquement)

Couvrir les routes non-triviales avec `@cloudflare/vitest-pool-workers` et une D1 en mémoire peuplée avec des fixtures.

```
src/routes/api/evaluation/generate/generate.test.ts
src/routes/api/evaluation/share/share.test.ts
```

#### Ce qu'on ne teste pas

- Composants Svelte (fragiles, faible ROI — valider manuellement)
- Routes SvelteKit triviales (CRUD simple sans logique)
- Stores Svelte

### Conventions de test

```typescript
// Nommage : describe → it, en français (c'est le domaine métier)
describe('drawQuestions', () => {
  it('retourne le bon nombre de questions', () => { ... })
  it('exclut les questions non publiées', () => { ... })
  it('filtre par support applicable', () => { ... })
})

// Fixtures : données de test dans __fixtures__/ à côté des tests
// Pas de beforeEach qui fait trop de choses — préférer des helpers locaux

// Math.random() : mocker au niveau du module, pas dans chaque test
vi.spyOn(Math, 'random').mockReturnValue(0.5)
```

### Lancer les tests

```bash
npm run test           # tous les tests unitaires (vitest)
npm run test:watch     # mode watch
npm run test:int       # tests d'intégration (vitest-pool-workers)
```

---

## 6. API routes (SvelteKit)

### Structure d'une route API

```typescript
// src/routes/api/evaluation/generate/+server.ts
import { json, error } from '@sveltejs/kit'
import { z } from 'zod'
import { drawEvaluation } from '$lib/domain/draw'
import { getTemplate } from '$lib/server/db/queries/templates'

const schema = z.object({
  support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']),
  format: z.enum(['standard', 'raccourcie', 'positionnement'])
})

export const GET = async ({ url, platform }) => {
  const parsed = schema.safeParse({
    support: url.searchParams.get('support'),
    format: url.searchParams.get('format')
  })
  if (!parsed.success) throw error(400, 'Paramètres invalides')

  const db = platform!.env.DB
  const template = await getTemplate(db, parsed.data)
  if (!template) throw error(404, 'Template introuvable')

  const evaluation = drawEvaluation(template)
  return json(evaluation)
}
```

### Règles

- **Validation Zod en entrée** systématique, avant tout traitement.
- **`platform!.env`** pour accéder aux bindings Cloudflare (D1, R2). Typer via `app.d.ts`.
- Retourner des codes HTTP explicites et des messages d'erreur lisibles.
- Pas de logique métier dans les routes — déléguer à `domain/`.

---

## 7. Base de données (Drizzle + D1)

### Règles

- **Le schéma Drizzle est la source de vérité**. Ne jamais écrire de SQL à la main en dehors des migrations.
- **Une fonction par requête** dans `server/db/queries/`. Pas de requêtes inline dans les routes.
- **Pas de `select *`**. Toujours lister les colonnes sélectionnées.
- Les données JSON stockées en `text` sont parsées/sérialisées **uniquement dans `server/db/queries/`**, jamais dans les routes ou le domaine.

```typescript
// ✅ Bon — parsing JSON localisé dans la couche DB
export async function getQuestions(db: D1Database, sectionId: number): Promise<Question[]> {
  const rows = await drizzle(db).select().from(questions).where(...)
  return rows.map(row => ({
    ...row,
    applicableSupports: JSON.parse(row.applicable_supports ?? '[]')
  }))
}
```

### Migrations

Les migrations sont générées par Drizzle Kit (`drizzle-kit generate`) et appliquées via `wrangler d1 migrations apply`. Ne jamais modifier un fichier de migration déjà appliqué en production — créer une nouvelle migration.

---

## 8. Commentaires

Écrire des commentaires uniquement quand le **pourquoi** n'est pas évident à la lecture du code. Ne pas commenter le **quoi**.

```typescript
// ❌ Inutile
// Filtre les questions publiées
const published = questions.filter(q => q.status === 'publie')

// ✅ Utile — explique une contrainte non-évidente
// D1 ne supporte pas les tableaux natifs : applicable_supports est stocké
// en JSON stringifié et doit être parsé à chaque lecture.
const supports = JSON.parse(row.applicable_supports ?? '[]')
```

Pas de blocs de commentaires multi-lignes, pas de docstrings exhaustives. Une ligne suffit.
