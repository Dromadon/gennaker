# Evaluation — Structure de données et flux de tirage

## Structure de données

```
Evaluation
  support: Support                  -- 'deriveur' | 'catamaran' | 'windsurf'
  format: Format                    -- 'standard' | 'raccourcie' | 'positionnement'
  slots: EvaluationSlot[]

EvaluationSlot
  slotId: number                    -- id du template_slot source
  sectionId: number
  categoryId: number
  sectionDisplayName: string
  categoryDisplayName: string
  questions: Question[]             -- questions tirées pour ce slot

Question
  id, sectionId, title
  questionMd, correctionMd         -- markdown brut
  applicableSupports: Support[]    -- [] = tous supports
  answerSize: 'xs'|'sm'|'md'|'lg'|'xl' -- espace de réponse à l'impression
```

Le template source (en base) décrit la *structure* : quelles sections, combien de questions par slot. L'évaluation est la *réalisation* : les questions effectivement tirées, stockées dans un store Svelte côté client.

---

## Flux — tirage initial

```
GET /api/evaluation/generate?support=X&format=Y
  │
  ├─ Charge EvaluationTemplate (support × format) + ses TemplateSlots depuis D1
  │
  ├─ getQuestionMetaBySection(sectionIds) — charge id + applicableSupports uniquement
  │
  ├─ drawEvaluation(template, metaBySection) → IDs tirés par slot
  │    Pour chaque slot :
  │      pool = metas de la section filtrées par support
  │      shuffle(pool).slice(0, slot.questionCount) → questionIds
  │
  ├─ getQuestionsByIds(allIds) — charge le contenu complet des ~5-20 questions tirées
  │
  └─ Retourne Evaluation (JSON) assemblée
       └─ stocké dans evaluationStore (Svelte writable)
```

Implémentation côté serveur : `src/lib/domain/draw.ts → drawEvaluation()`  
Requêtes DB : `getQuestionMetaBySection()` (pool pour le tirage) puis `getQuestionsByIds()` (contenu des questions tirées)

---

## Flux — re-tirage aléatoire d'une section (↺)

```
Clic ↺ sur l'en-tête d'une section (vue /evaluation)
  │
  ├─ Pour chaque question du slot :
  │    POST /api/evaluation/redraw-question
  │         body: { sectionId, excludeQuestionIds: number[], support }
  │                excludeQuestionIds = IDs déjà dans le slot + déjà re-tirés dans cette passe
  │
  ├─ Serveur (par question) :
  │    pool = metas publiées de la section (getQuestionMetaBySection)
  │    candidats = pool ∖ excludeQuestionIds, filtrés par support
  │    si vide → 422  (question originale conservée côté client)
  │    sinon  → getQuestionsByIds([id]) → Question complète → 200
  │
  └─ Client :
       setSlotQuestions(slotId, newQuestions) dans evaluationStore
       Toast "Section re-tirée"
```

Endpoint : `src/routes/api/evaluation/redraw-question/+server.ts`  
Store : `src/lib/stores/evaluation.ts → setSlotQuestions()`

---

## Flux — sélection manuelle des questions d'une section (🔍)

Voir [docs/manual-question-pick.md](./manual-question-pick.md) pour le détail complet.

```
Clic 🔍 sur l'en-tête d'une section (vue /evaluation)
  │
  └─ Ouvre QuestionPickerModal
       │
       ├─ POST /api/evaluation/question-candidates
       │    body: { sectionId, support, search? }
       │    → liste des questions publiées compatibles
       │
       └─ [Appliquer]
            setSlotQuestions(slotId, selectedQuestions) dans evaluationStore
            Toast "Section mise à jour" ou "Section désactivée"
```

Endpoint : `src/routes/api/evaluation/question-candidates/+server.ts`  
Store : `src/lib/stores/evaluation.ts → setSlotQuestions()`

---

## Flux — partage d'une évaluation (US-23)

```
Clic "Partager" (barre mobile ou header desktop, vue /evaluation)
  │
  ├─ POST /api/evaluation/share
  │    body: Evaluation complète (depuis evaluationStore)
  │
  ├─ Serveur :
  │    Valide avec Zod
  │    Mappe slots → SharedEvaluationSlotJson[] (garde slotId, sectionId, categoryId,
  │      displayNames, slugs, questionIds uniquement — pas le contenu des questions)
  │    Génère shortCode (nanoid 6 chars alphanumériques)
  │    INSERT INTO shared_evaluations (short_code, support_slug, format, slots_json,
  │      created_at, expires_at = now + 30j)
  │    → retourne { url: '/e/{shortCode}' }
  │
  └─ Client :
       Ouvre ShareModal avec l'URL complète
       Bouton "Copier le lien" → clipboard

Query : `src/lib/server/db/queries/shared-evaluations.ts → createSharedEvaluation()`
```

### Format slots_json (stocké en D1)

```json
[
  {
    "slotId": 1,
    "sectionId": 10,
    "categoryId": 2,
    "sectionDisplayName": "Météo",
    "categoryDisplayName": "Navigation",
    "categorySlug": "navigation",
    "sectionSlug": "meteo",
    "questionIds": [42, 17]
  }
]
```

Seuls les IDs des questions sont persistés. Le contenu complet est rechargé depuis D1 à chaque consultation.

---

## Flux — consultation d'un lien partagé

```
GET /e/{code}
  │
  ├─ +page.server.ts (SvelteKit SSR, Worker Cloudflare) :
  │    Valide code (6 chars alphanumériques) → 400 si invalide
  │    getSharedEvaluation(db, code) → null si inexistant → 404
  │    Vérifie expiresAt < now → retourne { expired: true } (page affiche message)
  │    getQuestionsByIds(allIds) pour tous les questionIds du snapshot
  │    Questions absentes (supprimées depuis le partage) → unavailableCount par slot
  │    → retourne { expired: false, support, format, slots, expiresAt }
  │
  └─ +page.svelte :
       Affiche l'évaluation (même structure que /evaluation)
       Si expired → message "Ce lien a expiré — générez une nouvelle évaluation"
       Si unavailableCount > 0 → encart orange par slot concerné
       Re-tirage (↺) et sélection manuelle (🔍) fonctionnent localement
         → appellent les mêmes APIs existantes (redraw-question, question-candidates)
         → ne modifient pas le snapshot en D1
```

Expiration : vérifiée à la lecture uniquement (`expires_at` en D1). Aucune purge serveur automatique.

