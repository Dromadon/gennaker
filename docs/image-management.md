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

Clé R2 : `{questionId}/images/{filename}`

Exemple : `42/images/schema.png`

La clé est **stable** — elle ne dépend pas de la catégorie ou section. Déplacer une question
vers une autre catégorie/section ne nécessite aucune opération R2.

Chaque question dispose de son propre dossier `images/` — deux questions peuvent
référencer la même image source mais auront chacune leur copie dans R2.

---

## Résolution au rendu : `createMarkdownRenderer`

**Fichier :** `src/lib/markdown.ts`

```typescript
createMarkdownRenderer(
  questionId: number,
  r2BaseUrl: string
): (md: string) => string
```

Pour `images/{filename}` → `${r2BaseUrl}/${questionId}/images/${filename}`

`r2BaseUrl` est exposé par `src/routes/+layout.server.ts` depuis `platform.env.R2_PUBLIC_URL`.

### Utilisation dans la page d'évaluation

```svelte
{@html renderMd(question.questionMd, question.id)}
```

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

L'export (`GET /admin/export`) :
1. Liste tous les objets R2 avec pagination (`r2.list()` + curseur tant que `truncated`)
2. Pour chaque clé `{id}/images/{fn}`, retrouve la question dans le `questionMap` (déjà chargé)
3. Reconstruit la clé ZIP : `{cat}/{sec}/{id}/images/{fn}`

Les clés R2 (plates) et les chemins ZIP (hiérarchiques) sont donc distincts.

---

## Mapping R2 déterministe — pas de table catalogue

La clé R2 d'une image est entièrement dérivable depuis l'ID de la question :

```
{questionId}/images/{filename}
```

- `questionId` : clé primaire D1 de la question
- `filename` : extrait du markdown — chaque `images/{filename}` dans `question_md`
  ou `correction_md` correspond exactement à une clé R2

Il n'y a donc pas besoin de table catalogue. Pour connaître les images d'une question,
on parse son markdown. Pour les supprimer, on reconstruit les clés R2 et on appelle
`r2.delete(key)` pour chacune.

---

## Ajouter une image (futur admin CRUD)

1. Upload vers R2 : clé `{questionId}/images/{filename}`
2. Référencer dans le markdown : `![alt](images/{filename})`

---

## Setup local

Le développement local est le plus proche possible de la prod : les images sont stockées dans
le **R2 local** (miniflare, via `platformProxy`) et servies par la route proxy
`GET /r2-proxy/[...path]` (`src/routes/r2-proxy/[...path]/+server.ts`).

**Flow initial :**
```bash
npm run db:seed:local
```

`migrate-content.ts --local` génère le SQL **et** injecte les images depuis `archive/` dans
le R2 local via `wrangler r2 object put ... --local` sous les clés `{id}/images/{fn}`.

**`.dev.vars`** :
```
R2_PUBLIC_URL=/r2-proxy
```

Le renderer résout `images/schema.png` → `/r2-proxy/{id}/images/schema.png`, servi par la
route proxy qui lit depuis R2 local.

---

## Migration R2 vers la structure plate (one-shot remote)

Le script `scripts/migrate-r2-flat.ts` renomme toutes les clés R2 :

```
Avant : {cat}/{section}/{question_id}/images/{filename}
Après  : {question_id}/images/{filename}
```

```bash
npm run r2:migrate-flat:remote
```

Le script est idempotent : les clés déjà au format plat sont ignorées.

---

## Migration depuis les URLs absolues (historique)

Le script `scripts/migrate-image-urls.ts` (déjà exécuté) :
1. Requête D1 avec JOIN pour obtenir `id`, `category_slug`, `section_slug` et les markdowns
2. Pour chaque URL absolue trouvée (`https://pub-xxx.r2.dev/...`) :
   - Upload depuis `archive/` vers la clé R2
   - Remplace dans le markdown par `images/{fn}`
3. Exécute les `UPDATE` SQL sur D1

```bash
npm run db:migrate-image-urls:remote
```
