# Sélection manuelle d'une question (US-14)

## Vue d'ensemble

La sélection manuelle permet au formateur de choisir précisément une question de remplacement dans la banque, en complément du re-tirage aléatoire (US-07).

## Flux UX

```
Page évaluation
  └── Article question
        ├── [↺] Re-tirer au hasard  (US-07)
        └── [🔍] Choisir une question  (US-14)
                │
                ▼
        QuestionPickerModal
          ├── En-tête : nom de la section (fixe, non modifiable)
          ├── Champ recherche (filtre live, debounce 300ms)
          └── Liste des candidats
                ├── titre
                ├── badge difficulté (facile / moyen / difficile)
                ├── badge(s) support si restriction
                └── coche bleue + highlight si question déjà présente
                      │
                      ▼ clic sur une ligne
                Question remplacée dans l'évaluation
                Toast "Question remplacée"
                Modale fermée
```

## Règles de filtrage

Les candidats proposés dans la modale respectent ces règles, appliquées côté serveur dans `POST /api/evaluation/question-candidates` :

1. **Section fixée** — uniquement les questions de la même section que la question remplacée (le formateur ne peut pas changer de section)
2. **Support respecté** — les questions avec `applicableSupports` non vide n'apparaissent que si le support de l'évaluation y figure ; les questions avec `applicableSupports: []` apparaissent pour tous les supports
3. **Statut publié** — seules les questions `status = 'publie'` sont proposées
4. **Recherche texte** — filtre insensible à la casse sur le titre (paramètre optionnel `search`)

## Différence avec le re-tirage aléatoire (US-07)

| | Re-tirage (US-07) | Sélection manuelle (US-14) |
|---|---|---|
| Choix | Aléatoire | Manuel |
| Déclencheur | Bouton ↺ | Bouton 🔍 → modale |
| Questions exclues | Toutes celles du slot | Aucune (affichage avec badge si déjà présente) |
| Retour arrière | Non | Non |

## Persistance

La sélection **n'est pas persistée** entre sessions. Elle modifie uniquement le Svelte store `evaluationStore` en mémoire, comme le re-tirage aléatoire. Un rechargement de page remet l'évaluation à zéro.

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/routes/api/evaluation/question-candidates/+server.ts` | Endpoint POST — liste les candidats filtrés |
| `src/routes/api/evaluation/question-candidates/server.test.ts` | Tests unitaires de l'endpoint |
| `src/lib/components/QuestionPickerModal.svelte` | Composant modale de sélection |
| `src/lib/domain/types.ts` | Type `QuestionPickRow` |
| `src/lib/server/db/queries/questions.ts` | Fonction `getQuestionCandidates()` |
| `src/routes/evaluation/+page.svelte` | Intégration du bouton et de la modale |
