# Sélection manuelle des questions par section (US-17)

## Vue d'ensemble

Le picker permet au formateur de choisir manuellement toutes les questions d'une section, en complément du re-tirage aléatoire de toute la section.

## Flux UX

```
Page évaluation
  └── En-tête de section
        ├── [↺] Re-tirer toute la section au hasard
        └── [🔍] Choisir les questions  →  QuestionPickerModal
                │
                ▼
        QuestionPickerModal
          ├── En-tête : catégorie + nom de la section + compteur
          ├── Questions actives (fixe, haut de modale)
          │     └── liste des questions actuellement sélectionnées
          │           └── clic → retire la question (slide-out)
          ├── Champ recherche (filtre live, debounce 300ms)
          └── Questions disponibles (scrollable)
                ├── titre
                ├── badge difficulté (facile / moyen / difficile)
                ├── badge(s) support si restriction
                └── clic → ajoute la question (slide-out puis slide-in dans actives)
                      │
                      ▼ [Appliquer]
                Slot mis à jour dans l'évaluation
                Toast "Section mise à jour" ou "Section désactivée"
                Modale fermée
```

## Règles de filtrage des candidats

Appliquées côté serveur dans `POST /api/evaluation/question-candidates` :

1. **Section fixée** — uniquement les questions de la section du slot
2. **Support respecté** — questions avec `applicableSupports` non vide uniquement si le support de l'évaluation y figure ; `[]` = tous supports
3. **Statut publié** — seules les questions `status = 'publie'`
4. **Recherche texte** — filtre insensible à la casse sur le titre (paramètre optionnel `search`)

## Cas particulier : section désactivée

Si le formateur retire toutes les questions actives et applique, le slot est désactivé (0 questions). La section n'apparaît plus à l'impression. Un message "Section désactivée" s'affiche à la place.

## Différence avec le re-tirage aléatoire

| | Re-tirage (↺) | Picker (🔍) |
|---|---|---|
| Granularité | Toute la section | Question par question |
| Choix | Aléatoire | Manuel |
| Questions exclues | Celles déjà dans le slot | Aucune |
| Résultat | Nouvelles questions tirées | Exactement les questions choisies |

## Persistance

Les modifications sont stockées uniquement dans le store Svelte (`evaluationStore`) en mémoire. Un rechargement de page remet l'évaluation à zéro.

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/routes/api/evaluation/question-candidates/+server.ts` | Endpoint POST — liste les candidats filtrés |
| `src/routes/api/evaluation/question-candidates/server.test.ts` | Tests unitaires de l'endpoint |
| `src/lib/components/QuestionPickerModal.svelte` | Composant modale de sélection |
| `src/lib/domain/types.ts` | Types `QuestionPickRow`, `EvaluationSlot` |
| `src/lib/server/db/queries/questions.ts` | Fonction `getQuestionCandidates()` |
| `src/lib/stores/evaluation.ts` | Fonction `setSlotQuestions()` |
| `src/routes/evaluation/+page.svelte` | Boutons et intégration de la modale |
