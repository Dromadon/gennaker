# Gestion des images

## Convention de référencement dans le markdown

Les images sont référencées par des **URLs relatives** dans `question_md` et `correction_md` :

```markdown
![Schéma de virement de bord](images/schema.png)
```

Les URLs commençant par `/` ou `http` passent à travers le renderer sans transformation
(compatibilité locale et pendant migration).

---

## Stockage R2

Clé R2 : `{categorySlug}/{sectionSlug}/{questionId}/images/{filename}`

Exemple : `meteo/carte_meteo/42/images/schema.png`

Chaque question dispose de son propre dossier `images/` — deux questions peuvent
référencer la même image source mais auront chacune leur copie dans R2.

---

## Résolution au rendu : `createMarkdownRenderer`

**Fichier :** `src/lib/markdown.ts`

```typescript
createMarkdownRenderer(
  questionId: number,
  categorySlug: string,
  sectionSlug: string,
  r2BaseUrl: string
): (md: string) => string
```

Pour `images/{filename}` → `${r2BaseUrl}/${categorySlug}/${sectionSlug}/${questionId}/images/${filename}`

`r2BaseUrl` est exposé par `src/routes/+layout.server.ts` depuis `platform.env.R2_PUBLIC_URL`.

### Utilisation dans la page d'évaluation

`slot.categorySlug` et `slot.sectionSlug` sont disponibles dans le template via `EvaluationSlot` :

```svelte
{@html renderMd(question.questionMd, question.id, slot.categorySlug, slot.sectionSlug)}
```

### Origine des slugs

`getTemplate` (`src/lib/server/db/queries/templates.ts`) fait déjà les JOINs
`templateSlots → sections → categories` et sélectionne `categories.slug` et `sections.slug`.
`drawEvaluation` propage ces champs de `TemplateSlot` vers `EvaluationSlot`.

---

## Structure du ZIP d'export

```
{categorySlug}/
  {sectionSlug}/
    {questionId}/
      Titre de la question.md     ← énoncé + correction
      images/
        schema.png                ← co-localisé, lien relatif valide
templates.json
```

L'export (`GET /admin/export`) liste tous les objets R2 avec `r2.list()` et les place
directement dans le ZIP avec la même clé (chemin R2 = chemin ZIP).

---

## Table `question_images`

Catalogue pour le futur admin CRUD. Non utilisée par l'export ZIP ni par le renderer.

```sql
question_images (
  id          INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  filename    TEXT NOT NULL,
  storage_url TEXT NOT NULL   -- clé R2 : {cat}/{section}/{id}/images/{filename}
)
```

---

## Ajouter une image (futur admin CRUD)

1. Upload vers R2 : clé `{cat}/{section}/{questionId}/images/{filename}`
2. Insérer dans `question_images`
3. Référencer dans le markdown : `![alt](images/{filename})`

---

## Setup local

Le développement local utilise le même format de markdown que la production (`images/{fn}`).

**Flow initial :**
```bash
npm run db:seed:local
```
`migrate-content.ts --local` génère le SQL **et** copie les images depuis `archive/` vers
`static/questions-images/{cat}/{sec}/{questionId}/images/`.

**`.dev.vars`** — ajouter la ligne suivante pour que le renderer sache résoudre les URLs :
```
R2_PUBLIC_URL=/questions-images
```

Le renderer résout alors `images/schema.png` → `/questions-images/{cat}/{sec}/{id}/images/schema.png`,
servi statiquement par Vite/wrangler.

> `npm run images:local` est désormais obsolète — son rôle est absorbé par `db:seed:local`.

---

## Migration depuis les URLs absolues (remote)

Le script `scripts/migrate-image-urls.ts` :
1. Requête D1 avec JOIN pour obtenir `id`, `category_slug`, `section_slug` et les markdowns
2. Pour chaque URL absolue trouvée (`https://pub-xxx.r2.dev/{cat}/{section}/images/{fn}`) :
   - Upload depuis `archive/public/questions/{cat}/{section}/images/{fn}` vers la nouvelle clé R2
   - Insère dans `question_images`
   - Remplace dans le markdown par `images/{fn}`
3. Exécute les `UPDATE` SQL sur D1

```bash
npm run db:migrate-image-urls:remote
```

La DB locale utilise des chemins `/questions-images/...` (statique) qui passent
à travers le renderer sans transformation — pas de migration locale nécessaire.
