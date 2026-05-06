# Interface admin — Templates et slots

Page `/admin/templates` : affichage et configuration des templates d'évaluation et de leurs slots.

---

## Concept

Un **template** est une combinaison support × format (ex. dériveur/standard). Il contient des **slots** ordonnés, chacun associé à une section et définissant combien de questions tirer.

Deux champs optionnels permettent d'orienter le tirage :

- **`pinnedQuestionId`** — une question toujours incluse dans ce slot (nullable)
- **`preferredQuestionIds`** — liste de questions prioritaires (JSON `number[]`, `[]` par défaut)

Ces champs sont stockés en base mais **pas encore utilisés dans le tirage** (logique future, priorité 7 dans le backlog).

---

## Routes

| Route | Rôle |
|---|---|
| `GET /admin/templates` | Liste tous les templates groupés par support/format |
| `POST /admin/templates?/setPinned` | Épingler ou effacer la question épinglée d'un slot |
| `POST /admin/templates?/setPreferred` | Remplacer la liste de questions préférées d'un slot |

---

## Actions

### `setPinned`

| Champ FormData | Type | Description |
|---|---|---|
| `slotId` | number | ID du slot à modifier |
| `questionId` | number ou `''` | ID de la question à épingler, `''` pour effacer |

### `setPreferred`

| Champ FormData | Type | Description |
|---|---|---|
| `slotId` | number | ID du slot à modifier |
| `questionIds` | JSON string | Tableau d'IDs, ex. `[17, 42]` — remplace la liste entière |

---

## Audit

Les deux actions loggent un événement `template_slot.update` avec `targetType: 'template_slot'` et un snapshot `before`/`after`. Voir `docs/audit.md` pour le format détaillé.

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/routes/admin/templates/+page.server.ts` | Load + actions `setPinned` / `setPreferred` |
| `src/routes/admin/templates/+page.svelte` | UI deux colonnes (liste + panneau détail) |
| `src/lib/server/db/queries/templates.ts` | `getAllTemplatesWithSlots`, `getTemplateSlotById`, `updateTemplateSlot` |
| `src/lib/server/audit.ts` | `buildSlotAuditMetadata`, `SlotSnapshot` |
| `src/lib/domain/types.ts` | `TemplateSlot` (champs `pinnedQuestionId`, `preferredQuestionIds`) |
