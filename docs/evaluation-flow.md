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
  answerSize: 'xs'|'sm'|'md'|'lg' -- espace de réponse à l'impression
```

Le template source (en base) décrit la *structure* : quelles sections, combien de questions par slot. L'évaluation est la *réalisation* : les questions effectivement tirées, stockées dans un store Svelte côté client.

---

## Flux — tirage initial

```
GET /api/evaluation/generate?support=X&format=Y
  │
  ├─ Charge EvaluationTemplate (support × format) + ses TemplateSlots depuis D1
  │
  ├─ Pour chaque slot :
  │    pool = questions de la section (status='publie')
  │           filtrées : applicableSupports ∋ support (ou tableau vide = tous supports)
  │    shuffle(pool).slice(0, slot.questionCount)
  │
  └─ Retourne Evaluation (JSON)
       └─ stocké dans evaluationStore (Svelte writable)
```

Implémentation côté serveur : `src/lib/domain/draw.ts → drawEvaluation()`  
Requête DB : `src/lib/server/db/queries/questions.ts → getQuestionsBySection()`

---

## Flux — remplacement d'une question individuelle (US-07)

```
Clic ↺ sur une question (vue /evaluation)
  │
  ├─ POST /api/evaluation/redraw-question
  │    body: { sectionId, excludeQuestionIds: number[], support }
  │           excludeQuestionIds = tous les IDs déjà affichés dans le slot
  │
  ├─ Serveur :
  │    pool = questions publiées de la section (getQuestionsBySection)
  │    candidats = pool ∖ excludeQuestionIds, filtrés par support
  │    si vide → 422 { error: "Aucune autre question disponible dans cette section" }
  │    sinon  → Question aléatoire parmi les candidats → 200
  │
  └─ Client :
       200 → replaceQuestion(slotId, oldId, newQuestion) dans evaluationStore
       422 → toast d'erreur (disparaît après 4s)
```

Implémentation côté serveur : `src/lib/domain/draw.ts → pickReplacement()`  
Endpoint : `src/routes/api/evaluation/redraw-question/+server.ts`  
Store : `src/lib/stores/evaluation.ts → replaceQuestion()`
