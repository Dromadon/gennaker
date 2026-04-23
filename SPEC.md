# Spécification fonctionnelle — Gennaker

## 1. Présentation du produit

Gennaker est une application web permettant aux pratiquants de voile en formation pour devenir moniteur fédéral de s'entraîner à l'épreuve théorique. Elle permet également aux formateurs de générer, personnaliser et imprimer des évaluations pour les candidats.

L'application est utilisée sans compte par les deux profils principaux. Elle doit fonctionner aussi bien sur desktop (formateurs) que sur mobile (stagiaires en autonomie).

---

## 2. Acteurs

| Acteur | Description |
|--------|-------------|
| **Stagiaire** | Candidat au monitorat. Génère des évaluations pour s'entraîner chez lui, consulte les corrections, partage ou refait des évals. Pas de compte. |
| **Formateur** | Encadrant qui génère et imprime des évaluations pour les examens. Peut modifier la structure d'une éval avant impression. Pas de compte. |
| **Administrateur** | Gère la banque de questions et les templates d'évaluation. Valide les soumissions communautaires. Accès protégé par mot de passe. |
| **Contributeur** | Membre de la communauté qui soumet une question via le formulaire public. |

---

## 3. Modèle métier

### Hiérarchie du contenu

```
Support (dériveur, catamaran, windsurf, croisière…)
  └── [filtre sur les contenus ci-dessous]

Catégorie (météo, navigation, sécurité…)
  └── Section (carte météo, balisage, calcul de marée…)
        └── Question (énoncé + correction + métadonnées)
```

Le filtrage par support opère à tous les niveaux : une section peut être restreinte à certains supports (ex : "Manœuvres de port" → croisière uniquement), et une question peut l'être indépendamment de sa section (ex : une chronologie spécifique catamaran dans une section conduite partagée). En l'absence de restriction explicite, une catégorie, section ou question est considérée applicable à tous les supports.

### Entités principales

**Support**
Représente le type d'engin et/ou le cursus. La liste est extensible (ne pas la hardcoder). Valeurs : `deriveur`, `catamaran`, `windsurf`, `croisiere`. En v1, `croisiere` est présent en base de données et peut être associé à des sections et questions, mais n'est pas proposé comme choix dans l'interface publique (désactivé côté UI).

**Question**
Unité de contenu de base. Contient :
- un titre (texte court, une ligne, obligatoire) : affiché dans les listes et interfaces de sélection. Champ distinct de l'énoncé.
- un énoncé (markdown)
- une correction (markdown)
- des images optionnelles (référencées dans le markdown)
- une difficulté : `facile` | `moyen` | `difficile`
- une liste de supports applicables (vide = tous les supports)
- une taille de réponse attendue pour l'impression : `xs` | `sm` | `md` | `lg`
- un statut : `brouillon` | `publié`
- une source/attribution (markdown, optionnel)

**Template d'évaluation**
Structure de référence définie pour un couple support × format. Composé d'une liste ordonnée de slots.

**Slot de template**
Unité de structure d'un template :
- section cible (catégorie + section)
- nombre de questions à tirer
- filtre de difficulté optionnel (`any` | `facile` | `moyen` | `difficile`)
- **question épinglée** (`pinned`) optionnelle : une question spécifique toujours tirée pour ce slot (ex : "passage d'une perturbation" en météo). Peut être déverrouillée par le formateur.
- **questions par défaut** (`preferred`) optionnelles : liste de candidates prioritaires au premier tirage. Le tirage pioche en priorité dans cette liste avant d'ouvrir à toute la section. Sans garantie : le formateur peut re-tirer librement. Utile pour les formats courts comme `positionnement`, où on veut couvrir les fondamentaux sans les figer.

**Format d'évaluation**
Trois formats définis, applicables à chaque support :
- `standard` : évaluation complète (~16 questions)
- `raccourcie` : version allégée (~8 questions)
- `positionnement` : évaluation de positionnement (~6 questions)

**Évaluation (instance)**
Concrétisation d'un template avec des questions réellement tirées. Composée de slots instanciés `{section, questions tirées, épinglée ou non}`. Elle peut diverger du template si le formateur a modifié la structure.

**Lien de partage**
Référence courte et persistée vers une évaluation figée. Contient les IDs de questions et la structure au moment du partage. Expiration à 30 jours par défaut.

---

## 4. Fonctionnalités

### 4.1 Génération d'une évaluation

Le point d'entrée principal de l'application.

- L'utilisateur choisit un **support** et un **format**
- L'application charge le template correspondant et tire aléatoirement les questions en respectant :
  - le nombre de questions par slot
  - le filtre de difficulté du slot
  - les supports applicables de chaque question (seules les questions compatibles avec le support choisi sont candidates)
  - la question épinglée du slot si elle existe
- Les questions en statut `brouillon` ne sont jamais candidates au tirage
- Le résultat est affiché immédiatement, modifiable avant impression ou partage

### 4.2 Modification d'une évaluation générée

Une fois l'évaluation générée, le formateur (ou le stagiaire) peut la modifier :

**Actions sur un slot existant :**
- Re-tirer toutes les questions du slot (en excluant celles déjà présentes dans l'évaluation, si la banque le permet)
- Re-tirer une question individuelle (si le slot contient plusieurs questions)
- Ajouter une question au slot (augmente le count d'une unité et tire une question supplémentaire)
- Choisir manuellement une question : ouvre un sélecteur listant toutes les questions publiées et compatibles de la section, filtrables par difficulté. La question sélectionnée remplace la question courante ou est ajoutée au slot.
- Épingler/désépingler une question (une question épinglée est protégée des re-tirages)
- Déverrouiller une question épinglée par le template (pour la remplacer)

**Actions sur la structure :**
- Supprimer un slot
- Ajouter un slot depuis la liste des sections compatibles avec le support choisi
- Modifier le nombre de questions d'un slot (et re-tirer en conséquence)

La modification de structure est libre mais non guidée par des règles de conformité — c'est à l'évaluateur de s'assurer que son évaluation reste cohérente avec les exigences de l'association.

**Disposition de l'interface :**
Sur écran large, un panneau latéral fixe affiche la liste ordonnée des slots (catégorie → section → nombre de questions) avec les actions inline par slot. Le contenu de l'évaluation défile dans la zone principale à droite. Sur écran étroit (mobile), le panneau est accessible via un bouton flottant ou un tiroir.

### 4.3 Affichage et impression

Paramètres d'affichage toggleables (non persistés) :

- **Afficher la correction** : affiche le contenu de correction sous chaque question
- **Titres de catégories** : affiche ou masque les en-têtes de catégorie entre les questions

Impression :
- Déclenchée via le bouton "Imprimer" → ouvre la boîte de dialogue d'impression du navigateur
- Le CSS d'impression garantit l'absence de coupure au milieu d'une question (page break propre)
- L'espace de réponse (lignes vides sous l'énoncé) s'affiche automatiquement à l'impression via `@media print`, jamais à l'écran
- Le document est nommé automatiquement (`Evaluation-{support}-{format}-{date}`)
- Les images sont incluses dans l'impression

### 4.4 Partage d'une évaluation

- L'utilisateur clique sur "Partager" à tout moment (avant ou après modification)
- L'état courant de l'évaluation (structure + questions tirées) est persisté en base
- Un lien court est généré : `gennaker.bzh/e/{short_code}`
- Le lien est valable **30 jours** par défaut
- À l'expiration, la page affiche un message explicite (pas une 404)
- Une évaluation partagée est figée : le lien pointe toujours vers les mêmes questions (questions épinglées et structure incluses, tels qu'ils étaient au moment du partage)
- La page partagée est lisible et imprimable sans compte, avec les mêmes paramètres d'affichage
- Si l'utilisateur modifie l'évaluation après avoir généré un lien, un bandeau d'avertissement s'affiche : "Cette évaluation a été modifiée depuis le dernier partage. Créez un nouveau lien pour partager la version actuelle." Le lien existant reste valide et inchangé.

> **Évolution future :** un compte permettrait de rendre un lien permanent et de gérer ses partages.

### 4.5 Consultation publique de la banque de questions

Page accessible sans compte, listant toutes les questions publiées organisées par catégorie et section.

- Navigation par catégorie → section
- Filtres : support, difficulté
- Affichage du titre, de l'énoncé et de la correction (correction masquée par défaut, révélable)
- Bouton "Signaler un problème" sur chaque question (voir 4.7)

### 4.6 Gestion de la banque de questions (admin)

Interface protégée par mot de passe. Étend la vue publique (4.5) avec les actions d'édition et la visibilité des questions en `brouillon`.

**Questions :**
- Créer, modifier, supprimer une question
- Édition en markdown avec prévisualisation côte à côte (titre, énoncé, correction)
- Upload et gestion des images associées
- Définir : catégorie, section, titre, supports applicables, difficulté, taille de réponse, statut
- Publier / dépublier une question

**Catégories et sections :**
- Créer, modifier, supprimer des catégories et sections
- Définir les supports applicables à une section (filtre de visibilité dans le constructeur d'évals)

**Templates d'évaluation :**
- Créer, modifier les templates (support × format)
- Gérer les slots : section, nombre de questions, filtre difficulté, question épinglée, questions par défaut
- La question épinglée d'un slot est choisie parmi les questions publiées de la section

### 4.7 Soumission communautaire de questions

Interface publique permettant à tout visiteur de proposer une question.

- Formulaire : section cible, titre, énoncé (markdown), correction (markdown), source, email de contact (optionnel)
- Protection anti-spam : honeypot + rate limiting (pas de CAPTCHA en v1)
- La soumission crée une entrée en statut `en attente`
- L'administrateur reçoit une notification email
- Interface admin de modération : liste des soumissions, prévisualisation, approbation ou rejet
- En cas d'approbation, la question est créée en statut `brouillon` (l'admin la complète et publie)

### 4.8 Signalement de problème sur une question

Depuis n'importe quelle question (évaluation en cours, banque publique), un bouton "Signaler un problème" ouvre un formulaire léger.

- Champs : description du problème ou correction proposée, email de contact (optionnel)
- La question concernée est automatiquement identifiée
- Le signalement arrive dans la file de modération admin, lié à la question (sous-type de soumission communautaire)
- L'admin peut corriger la question directement depuis l'interface de modération

---

## 5. Règles métier

| # | Règle |
|---|-------|
| R1 | Une question sans `applicable_supports` est candidate pour tous les supports. |
| R2 | Une section sans `applicable_supports` est visible pour tous les supports. |
| R3 | Seules les questions en statut `publié` sont candidates au tirage. |
| R4 | Lors du re-tirage d'un slot, les questions déjà présentes dans d'autres slots de la même évaluation sont exclues. Si la banque de la section ne contient pas assez d'alternatives, les doublons sont autorisés et un avertissement est affiché. |
| R5 | Une question épinglée par le template est toujours tirée. Le formateur peut la déverrouiller pour la remplacer. Les formateurs sont toujours décisionnaires finaux : aucune question n'est non-déverrouillable. |
| R6 | Un lien de partage expiré retourne un message d'erreur explicite, pas une 404. |
| R7 | Une évaluation partagée est immuable : modifier l'état local après avoir partagé ne modifie pas le lien existant (un nouveau partage crée un nouveau lien). |
| R8 | Le tirage respecte le filtre de difficulté du slot. Si la banque ne contient pas assez de questions au niveau demandé, le tirage est complété avec d'autres niveaux et un avertissement est affiché. |
| R9 | Les questions d'une soumission approuvée sont créées en `brouillon`, jamais directement publiées. |

---

## 6. Hors périmètre (v1)

- Comptes utilisateurs pour les stagiaires et formateurs
- Liens de partage permanents
- Gestion d'évaluation "favorites"
- Application mobile native
- Gestion multi-administrateurs avec rôles
- Export vers d'autres formats que PDF
