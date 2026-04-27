# Admin — CRUD Questions (US-11)

## Routes

| Route | Rôle |
|-------|------|
| `GET /admin/questions` | Liste paginée avec filtres |
| `GET /admin/questions/new` | Formulaire de création |
| `POST /admin/questions/new?/create` | Action de création |
| `GET /admin/questions/{id}/edit` | Formulaire d'édition pré-rempli |
| `POST /admin/questions/{id}/edit?/update` | Action de mise à jour |
| `POST /admin/questions/{id}/edit?/delete` | Action de suppression |
| `POST /admin/questions?/delete` | Suppression depuis la liste |

Toutes ces routes sont protégées par le guard admin (`/admin/+layout.server.ts`).
En plus, chaque action vérifie `locals.isAdmin` directement (défense en profondeur) et
retourne `error(403)` si la vérification échoue.

---

## Champs éditables

| Champ | Type | Valeurs admises |
|-------|------|----------------|
| `title` | text | 1–500 caractères |
| `sectionId` | integer | ID d'une section existante |
| `questionMd` | text | Markdown (min 1 caractère) |
| `correctionMd` | text | Markdown (peut être vide) |
| `difficulty` | enum | `facile` \| `moyen` \| `difficile` |
| `answerSize` | enum | `xs` \| `sm` \| `md` \| `lg` |
| `applicableSupports` | checkbox[] | `deriveur` \| `catamaran` \| `windsurf` \| `croisiere` — vide = tous |
| `status` | enum | `brouillon` \| `publie` |
| `sourceMd` | text | Optionnel |

La validation est assurée côté serveur par zod (`QuestionSchema`). En cas d'erreur, le
formulaire retourne un `fail(422)` avec les erreurs par champ.

---

## Liste et filtres

**URL params** : `?category={id}&section={id}&support={slug}&status={value}&page={n}`

- Filtres optionnels, combinables
- Filtre support : correspond aux questions dont `applicable_supports = '[]'` (tous)
  **ou** contient le support demandé (LIKE)
- Pagination : 20 questions par page, contrôlée par `LIMIT 20 OFFSET (page-1)*20`
- Le nombre total de questions correspondant aux filtres est retourné pour afficher la pagination

**Sélecteur section lié** : le select section est filtré côté client en fonction de la
catégorie choisie. Les catégories et sections sont chargées une seule fois par le `load`.

---

## Éditeur markdown

Le composant `QuestionForm.svelte` (`src/lib/components/QuestionForm.svelte`) expose
deux zones d'édition markdown avec prévisualisation en temps réel :

- Deux onglets : **Énoncé** / **Correction**
- Chaque onglet : textarea (gauche) + preview HTML (droite)
- Preview rendue via `marked.parse()` directement côté client, **sans résolution R2**
  (les images ne se résolvent pas en preview — prévu dans US-12)

---

## Suppression

Déclenchée par deux points d'entrée :
- Bouton **Supprimer** dans la ligne de la liste → dialog + POST `?/delete` avec `id` dans le body
- Bouton **Supprimer** dans la page d'édition → dialog + POST `?/delete` (id dans les params de route)

Le dialog de confirmation est un `<dialog>` natif HTML (pas de lib JS).

---

## Protection auth

Deux niveaux :

1. **Layout guard** (`src/routes/admin/+layout.server.ts`) : redirige vers `/admin/login`
   pour toute route `/admin/*` si `locals.isAdmin = false`. Testé dans `admin-guard.test.ts`.

2. **Guard dans chaque action** : les actions `create`, `update`, `delete` vérifient
   `locals.isAdmin` et retournent `error(403)` si faux, indépendamment du layout.
   Testé dans `questions.test.ts` et `edit.test.ts`.

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/domain/types.ts` | `QuestionListRow`, `QuestionAdminDetail`, `CategoryWithSections` |
| `src/lib/server/db/queries/categories.ts` | `getAllCategoriesWithSections()` |
| `src/lib/server/db/queries/questions.ts` | `getQuestionsAdmin`, `getQuestionAdminById`, `createQuestion`, `updateQuestion`, `deleteQuestion` |
| `src/lib/components/QuestionForm.svelte` | Formulaire réutilisable (create + edit) |
| `src/routes/admin/questions/+page.server.ts` | Load liste + action delete liste |
| `src/routes/admin/questions/new/+page.server.ts` | Load + action create |
| `src/routes/admin/questions/[id]/edit/+page.server.ts` | Load + actions update/delete |
| `src/routes/admin/questions/questions.test.ts` | Tests liste + création |
| `src/routes/admin/questions/[id]/edit/edit.test.ts` | Tests édition + suppression |
