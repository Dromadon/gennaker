# US-17 — Propositions d'interface : ajouter/retirer des questions

## Ce qui est commun à toutes les options

- **Section vide = section désactivée** : on peut retirer toutes les questions d'une section ; elle n'apparaît plus dans la vue principale ni à l'impression.
- **Panneau latéral** : le compteur de questions du slot se met à jour en temps réel et affiche "(désactivée)" quand le slot est vide.
- **Ajout d'une question** : via tirage aléatoire OU via sélection manuelle (QuestionPickerModal existant), pas uniquement aléatoire.
- **Session uniquement** : les modifications ne persistent pas entre sessions (identique à US-07/US-14).
- **Re-tirage de section** (US-06) : réinitialise au nombre du template, pas au nombre personnalisé.

## Ce qui reste à décider (choix d'interface)

Les trois options ci-dessous diffèrent sur :
1. **Où** les contrôles ajout/retrait apparaissent (sur chaque question, en bas de section, en modale)
2. **Quand** ils sont visibles (toujours, ou seulement en mode édition)
3. **Quelle entrée** déclenche la gestion de section (bouton par question, bouton par section, mode global)

---

## Option A — Mode édition dédié

Un bouton **"Éditer"** dans la topbar (à côté de "Correction") bascule la vue en mode édition.

En mode édition :
- Chaque question affiche un bouton **"−"** supplémentaire dans sa zone de boutons (top-right).
- Sous la dernière question de chaque section, un bouton large **"+ Ajouter une question"** apparaît (clic → menu : "Tirer aléatoirement" ou "Choisir dans la banque").
- Les sections vides affichent uniquement le bouton "+" (leur titre reste visible pour signaler qu'elles sont désactivées).
- Hors mode édition : interface identique à aujourd'hui, aucun ajout visuel.

```
Topbar :
  [Correction] [Éditer ✎]

Vue normale :
  SECTION A
  ┌─────────────────────┬──────┐
  │ Question 1          │ ↺  ⊕ │
  └─────────────────────┴──────┘

Mode édition activé :
  SECTION A
  ┌─────────────────────┬──────────┐
  │ Question 1          │ ↺  ⊕  − │
  └─────────────────────┴──────────┘
  ┌─────────────────────┬──────────┐
  │ Question 2          │ ↺  ⊕  − │
  └─────────────────────┴──────────┘
  ┌─ + Ajouter une question ───────┐
  └────────────────────────────────┘

  SECTION B  (désactivée)
  ┌─ + Ajouter une question ───────┐
  └────────────────────────────────┘
```

**Avantages**
- Interface propre hors édition, pas de surcharge visuelle.
- Cohérent avec le bouton "Correction" (même paradigme bascule).
- Le "−" est clairement contextuel → pas de risque de suppression accidentelle.

**Inconvénients**
- Nécessite un geste supplémentaire pour accéder au retrait (activer le mode).
- Deux états à gérer dans le composant.

---

## Option B — Boutons permanents discrets

Les contrôles sont **toujours visibles**, mais stylisés pour ne pas surcharger visuellement.

- Bouton **"×"** (retrait) dans la zone top-right de chaque question, gris clair, devient rouge au survol.
- Lien textuel **"+ ajouter"** centré sous la dernière question de chaque section, en gris très clair avec séparateur en pointillés.
- Sections vides : seul le lien "+ ajouter" est visible (titre de section supprimé ou grisé).

```
SECTION A
┌─────────────────────┬──────────┐
│ Question 1          │ ↺  ⊕  × │
└─────────────────────┴──────────┘
┌─────────────────────┬──────────┐
│ Question 2          │ ↺  ⊕  × │
└─────────────────────┴──────────┘
         ···  + ajouter  ···

SECTION B  (désactivée)
         ···  + ajouter  ···
```

**Avantages**
- Accès immédiat, aucun mode à activer.
- Flux identique aux boutons "↺" et "⊕" déjà présents.
- Moins d'état à gérer.

**Inconvénients**
- Ajoute un élément visuel sur chaque question card.
- "×" peut être confondu avec "fermer une notification".
- Zone de boutons top-right déjà chargée (3 boutons → 4).

---

## Option D — Picker multi-sélection par section

Un bouton **"Gérer ✎"** à côté du titre de chaque section ouvre une version étendue du `QuestionPickerModal` existant, en mode multi-sélection.

Dans la modale :
- Les questions actuellement dans l'évaluation apparaissent **cochées**.
- Cocher une question non sélectionnée l'**ajoute**.
- Décocher une question sélectionnée la **retire**.
- Bouton "Appliquer" valide toutes les modifications d'un coup.
- Bouton "Annuler" ignore les changements.

La vue principale reste inchangée (aucun bouton supplémentaire sur les questions).

```
SECTION A [Gérer ✎]
┌─────────────────────┬──────┐
│ Question 1          │ ↺  ⊕ │
└─────────────────────┴──────┘

    ╔═══════════════════════════════════╗
    ║ Questions — Section A             ║
    ║ 🔍 [rechercher...]                ║
    ║───────────────────────────────────║
    ║ ✅ Question 1  (dans l'éval)       ║
    ║ ✅ Question 2  (dans l'éval)       ║
    ║ ○  Question 3                      ║
    ║ ○  Question 4                      ║
    ║───────────────────────────────────║
    ║              [Appliquer] [Annuler] ║
    ╚═══════════════════════════════════╝
```

**Avantages**
- Vue d'ensemble complète du slot et des questions disponibles.
- Réutilise la logique du `QuestionPickerModal` existant (candidats, recherche, exclusions).
- Un seul point d'entrée pour gérer le contenu d'une section.
- Pas de suppression accidentelle : les changements sont confirmés en bloc.

**Inconvénients**
- Refonte du `QuestionPickerModal` (actuellement mono-sélection avec remplacement immédiat).
- Change la sémantique de l'entrée (par section, pas par question).
- Les boutons "↺" et "⊕" par question continuent de fonctionner → deux flux coexistent pour la modification.

---

## Hybridations possibles

- **A + D** : mode édition global (Option A) pour le retrait question par question, et bouton "Gérer" par section (Option D) pour l'ajout — évite d'avoir le picker accessible en permanence.
- **B + D** : "×" permanent par question (Option B) pour le retrait rapide, "Gérer" par section (Option D) pour l'ajout avec sélection.
