# Modération des soumissions communautaires (US-19)

## Vue d'ensemble

Tout utilisateur (anonyme) peut proposer une nouvelle question via le formulaire `/soumettre` (US-18). Les soumissions sont stockées en base avec le statut `en_attente` et consultables par l'administrateur depuis `/admin/submissions`.

L'admin peut **approuver** une soumission (ce qui crée automatiquement une question en brouillon) ou la **rejeter** (avec une note optionnelle).

---

## Table `community_submissions`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer PK | Identifiant |
| `section_id` | FK → sections | Section ciblée |
| `title` | text | Titre court de la question |
| `question_md` | text | Énoncé en markdown |
| `correction_md` | text | Correction en markdown |
| `applicable_supports` | text (JSON) | Supports applicables, ex. `["deriveur","catamaran"]` |
| `submitter_name` | text | Nom du contributeur |
| `submitter_email` | text | Email du contributeur |
| `status` | text | `en_attente` \| `approuve` \| `rejete` |
| `rejection_note` | text (nullable) | Note de rejet optionnelle (max 300 chars) |
| `approved_question_id` | FK → questions (nullable) | Id de la question créée lors de l'approbation |
| `created_at` | integer | Timestamp Unix de soumission |
| `reviewed_at` | integer (nullable) | Timestamp Unix de modération |

---

## Interface admin

### Accès

`/admin/submissions` — lien dans la navigation admin. Un badge indique le nombre de soumissions `en_attente`.

`/admin/submissions/[id]` — page dédiée à une soumission, accessible directement depuis la piste d'audit (`/admin/audit`). Affiche le même contenu que le panneau latéral. Les actions de modération (approuver / rejeter) y sont disponibles si la soumission est `en_attente`.

### Tableau des soumissions

Colonnes : titre, catégorie / section, soumis par, date, statut.

Cliquer sur une ligne ouvre un **panneau latéral** (desktop) ou un écran plein (mobile) affichant :
- Les métadonnées : soumetteur (nom + email cliquable), date, statut
- Une prévisualisation complète (énoncé + correction via `QuestionPreview`)
- Les actions de modération (si statut `en_attente`)
- Un lien vers la question créée (si statut `approuve`)

### Statuts

| Valeur | Signification |
|--------|---------------|
| `en_attente` | Soumission non traitée (comptabilisée dans le badge nav) |
| `approuve` | Soumission acceptée, question brouillon créée |
| `rejete` | Soumission refusée |

### Actions de modération

Disponibles uniquement pour les soumissions `en_attente` :

- **Approuver** : crée une question en DB avec statut `brouillon`, pré-remplie des champs de la soumission (difficulté par défaut : `moyen`, taille réponse : `md`). Met à jour `approved_question_id` et `reviewed_at`. Affiche ensuite un lien "Voir dans l'admin questions".
- **Rejeter** : passe la soumission en `rejete` avec la note de rejet et met à jour `reviewed_at`. Pas de création de question.

> Note : D1 ne supporte pas les vraies transactions. L'approbation effectue deux opérations séquentielles — si la seconde échoue, la question existe en brouillon mais la soumission reste `en_attente` ; l'admin peut réessayer.

### Filtres

Les soumissions peuvent être filtrées par statut : Tous / En attente / Approuvé / Rejeté (`?status=en_attente`, etc.). La liste est paginée à 20 par page, triée par date décroissante.

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/lib/server/db/schema.ts` | Table `communitySubmissions` (colonne `approvedQuestionId` ajoutée en US-19) |
| `drizzle/migrations/0007_submissions_approved_question.sql` | Migration `ALTER TABLE` |
| `src/lib/server/db/queries/submissions.ts` | Requêtes CRUD + requêtes admin (list, count, approve, reject) |
| `src/routes/soumettre/+page.server.ts` | Formulaire de soumission public (US-18) |
| `src/routes/admin/submissions/+page.server.ts` | Load + actions `approve` / `reject` |
| `src/routes/admin/submissions/+page.svelte` | Interface admin avec panneau latéral |
| `src/routes/admin/submissions/[id]/+page.server.ts` | Load de la soumission par id (404 si absente) |
| `src/routes/admin/submissions/[id]/+page.svelte` | Page dédiée (liens depuis l'audit) |
| `src/routes/admin/+layout.server.ts` | Badge compteur nav (`pendingSubmissionsCount`) |
| `src/routes/admin/+layout.svelte` | Lien "Soumissions" dans la nav admin |
| `src/lib/components/QuestionPreview.svelte` | Composant mutualisé de prévisualisation (réutilisé tel quel) |
