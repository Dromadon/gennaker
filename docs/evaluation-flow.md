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
