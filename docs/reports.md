# Signalement de problèmes sur les questions (US-16)

## Vue d'ensemble

Tout utilisateur (anonyme) peut signaler un problème sur une question depuis l'évaluation ou la banque publique. Les signalements sont consultables et traitables par l'administrateur depuis `/admin/reports`.

---

## Flux côté utilisateur

1. Un lien discret "Signaler un problème" apparaît en bas de chaque carte question dans `/evaluation`, et en bas du panneau de prévisualisation dans `/questions`.
2. Cliquer ouvre une modale `ReportModal` qui affiche le titre de la question en lecture seule.
3. L'utilisateur choisit un type de problème (obligatoire), saisit une description (obligatoire, max 500 caractères) et peut ajouter un email de contact (optionnel).
4. Après envoi, un message de confirmation s'affiche (`/evaluation` : toast ; `/questions` : texte inline).

### Types de problèmes disponibles

| Valeur | Libellé affiché |
|--------|-----------------|
| `enonce_incorrect` | Énoncé incorrect |
| `correction_incorrecte` | Correction incorrecte |
| `question_doublon` | Question en doublon |
| `mise_en_forme` | Problème de mise en forme |
| `autre` | Autre |

---

## Protection anti-spam

Deux couches, sans dépendance externe :

1. **Honeypot** : un champ caché (`display:none`, `aria-hidden`) est inclus dans la modale. Si ce champ est rempli (comportement typique des bots qui remplissent tous les champs du DOM), la requête est rejetée silencieusement avec un HTTP 200 — le bot ne sait pas qu'il a été détecté.

2. **User-Agent filtering** : les requêtes sans `User-Agent` ou dont l'UA correspond au pattern `/bot|crawler|spider|headless/i` sont rejetées avec HTTP 400.

---

## Endpoint public

`POST /api/questions/[id]/report`

Corps JSON attendu :

```json
{
  "problemType": "enonce_incorrect",
  "description": "Description obligatoire (max 500 chars)",
  "email": "contact@example.com",
  "honeypot": ""
}
```

Codes de retour :

| Code | Situation |
|------|-----------|
| 201 | Signalement enregistré |
| 200 | Honeypot rempli (rejet silencieux) |
| 400 | User-Agent absent/bot, ID invalide, description absente/vide, email invalide, ou données invalides |
| 404 | Question introuvable |

---

## Interface admin

### Accès

`/admin/reports` — lien dans la navigation admin. Un badge rouge indique le nombre de signalements en statut `nouveau`.

`/admin/reports/[id]` — page dédiée à un signalement, accessible directement depuis la piste d'audit (`/admin/audit`). Affiche le même contenu que le panneau latéral. L'action "Marquer résolu / Rouvrir" y est disponible.

### Tableau des signalements

Colonnes : titre de la question, type de problème, date, statut, action.

Cliquer sur une ligne ouvre un **panneau latéral** affichant :
- Le type de problème et la description complète
- L'email de contact (si renseigné)
- Une prévisualisation complète de la question concernée (énoncé + correction + source)
- Un lien vers le formulaire d'édition de la question

### Statuts

| Valeur | Signification |
|--------|---------------|
| `nouveau` | Signalement non traité (comptabilisé dans le badge nav) |
| `resolu` | Traité |

### Actions

Chaque ligne dispose d'un bouton unique :
- **"Marquer résolu"** si le statut est `nouveau` → passe à `resolu`
- **"Rouvrir"** si le statut est `resolu` → repasse à `nouveau`

### Filtres

Les signalements peuvent être filtrés par statut via les boutons en haut de page (`?status=nouveau`, `?status=resolu`).

---

## Composant mutualisé `QuestionPreview`

`src/lib/components/QuestionPreview.svelte` est utilisé à la fois dans le panneau admin (prévisualisation d'une question signalée) et dans `/questions` (banque publique). Il reçoit les données de la question en props et effectue le rendu markdown.

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/lib/server/db/schema.ts` | Table `question_reports` (colonnes : id, questionId, problemType, description, email, status, createdAt) |
| `src/lib/server/db/queries/reports.ts` | Queries CRUD + JOIN étendu pour la prévisualisation admin |
| `src/routes/api/questions/[id]/report/+server.ts` | Endpoint POST public |
| `src/lib/components/ReportModal.svelte` | Modale de signalement (description obligatoire + champ email) |
| `src/lib/components/QuestionPreview.svelte` | Composant mutualisé de prévisualisation |
| `src/routes/admin/reports/+page.server.ts` | Load + action `toggleStatus` |
| `src/routes/admin/reports/+page.svelte` | Interface admin avec panneau latéral |
| `src/routes/admin/reports/[id]/+page.server.ts` | Load du signalement par id (404 si absent) |
| `src/routes/admin/reports/[id]/+page.svelte` | Page dédiée (liens depuis l'audit) |
| `src/lib/server/db/queries/reports.ts` | `getReportById()` — requête avec JOINs pour la page dédiée |
| `src/routes/admin/+layout.server.ts` | Badge compteur nav |
| `src/routes/evaluation/+page.svelte` | Lien "Signaler un problème" sur les cartes question |
| `src/routes/questions/+page.svelte` | Lien "Signaler un problème" dans la prévisualisation |
