# Signalement de problèmes sur les questions (US-16)

## Vue d'ensemble

Tout utilisateur (anonyme) peut signaler un problème sur une question depuis l'évaluation ou la banque publique. Les signalements sont consultables et traitables par l'administrateur depuis `/admin/reports`.

---

## Flux côté utilisateur

1. Un bouton icône (triangle d'avertissement) apparaît sur chaque question dans `/evaluation`, et un lien "Signaler un problème" en bas du panneau de prévisualisation dans `/questions`.
2. Cliquer ouvre une modale `ReportModal` qui affiche le titre de la question en lecture seule.
3. L'utilisateur choisit un type de problème (obligatoire) et peut ajouter une description libre (max 500 caractères).
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
  "description": "Texte optionnel (max 500 chars)",
  "honeypot": ""
}
```

Codes de retour :

| Code | Situation |
|------|-----------|
| 201 | Signalement enregistré |
| 200 | Honeypot rempli (rejet silencieux) |
| 400 | User-Agent absent/bot, ID invalide, ou données invalides |
| 404 | Question introuvable |

---

## Interface admin

### Accès

`/admin/reports` — lien dans la navigation admin. Un badge rouge indique le nombre de signalements en statut `nouveau`.

### Tableau des signalements

Colonnes : titre de la question (lien vers `/admin/questions/[id]/edit`), type de problème, description (tronquée), date, statut.

### Statuts

| Valeur | Signification |
|--------|---------------|
| `nouveau` | Signalement non traité (comptabilisé dans le badge nav) |
| `en_cours` | Pris en charge par l'admin |
| `resolu` | Traité |

L'admin change le statut via un `<select>` inline dans le tableau ; la soumission est automatique au changement de valeur.

### Filtres

Les signalements peuvent être filtrés par statut via les boutons en haut de page (`?status=nouveau`, `?status=en_cours`, `?status=resolu`).

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `src/lib/server/db/schema.ts` | Table `question_reports` |
| `src/lib/server/db/queries/reports.ts` | Queries CRUD |
| `src/routes/api/questions/[id]/report/+server.ts` | Endpoint POST public |
| `src/lib/components/ReportModal.svelte` | Modale de signalement |
| `src/routes/admin/reports/+page.server.ts` | Load + action admin |
| `src/routes/admin/reports/+page.svelte` | Interface admin |
| `src/routes/admin/+layout.server.ts` | Badge compteur nav |
| `src/routes/evaluation/+page.svelte` | Bouton signaler sur les questions |
| `src/routes/questions/+page.svelte` | Lien signaler dans la prévisualisation |
