# Piste d'audit (US-20c)

Journal des actions administrateurs stocké en D1, consultable depuis `/admin/audit`.

---

## Table `audit_logs`

| Colonne | Type | Description |
|---|---|---|
| `id` | integer PK | |
| `admin_id` | integer FK → admins | NULL si admin supprimé (ON DELETE SET NULL) |
| `action` | text | Slug de l'action (voir taxonomie ci-dessous) |
| `target_type` | text | `question` \| `submission` \| `report` |
| `target_id` | integer | ID de la ressource concernée |
| `metadata` | text (JSON) | Snapshot before/after ou contexte (voir format) |
| `ip_address` | text | IP du client (`cf-connecting-ip` en priorité) |
| `created_at` | integer | Timestamp Unix (secondes) |

---

## Taxonomie des actions

| `action` | Déclencheur |
|---|---|
| `question.create` | Création d'une question (formulaire admin ou approbation soumission) |
| `question.update` | Modification d'une question |
| `question.delete` | Suppression d'une question |
| `submission.approve` | Approbation d'une soumission communautaire |
| `submission.reject` | Rejet d'une soumission |
| `report.resolve` | Passage d'un signalement à `resolu` |
| `report.reopen` | Réouverture d'un signalement (`nouveau`) |
| `template_slot.update` | Modification du pin ou des préférées d'un slot |

---

## Format du champ `metadata`

### Questions (create / update / delete)

```json
{
  "before": null,
  "after": {
    "id": 42, "title": "...", "sectionId": 3,
    "difficulty": "moyen", "answerSize": "md",
    "status": "brouillon", "applicableSupports": ["deriveur"],
    "sourceMd": null, "questionMd": "...", "correctionMd": "..."
  }
}
```

- **create** : `before` est `null`
- **update** : `before` et `after` sont tous les deux renseignés
- **delete** : `after` est `null`

### Soumissions (approve / reject)

```json
{
  "submissionId": 7,
  "title": "Ma question",
  "submitterName": "Jean Dupont",
  "submitterEmail": "jean@example.com",
  "newQuestionId": 42
}
```

Pour un rejet, `newQuestionId` est absent et `rejectionNote` peut être présent.

### Signalements (resolve / reopen)

```json
{
  "reportId": 3,
  "questionId": 42,
  "newStatus": "resolu"
}
```

### Slots de template (update)

```json
{
  "before": { "slotId": 12, "templateId": 3, "pinnedQuestionId": null, "preferredQuestionIds": [] },
  "after":  { "slotId": 12, "templateId": 3, "pinnedQuestionId": 42,   "preferredQuestionIds": [17, 55] }
}
```

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/lib/server/db/schema.ts` | Définition Drizzle de la table `audit_logs` |
| `drizzle/migrations/0009_audit_logs.sql` | Migration SQL |
| `src/lib/server/audit.ts` | Helpers `buildQuestionAuditMetadata`, `buildSubmissionAuditMetadata`, `buildReportAuditMetadata` |
| `src/lib/server/db/queries/audit.ts` | `insertAuditLog`, `getAuditLogs`, `getAllAuditLogsForExport` |
| `src/routes/admin/audit/+page.server.ts` | Load de la page journal |
| `src/routes/admin/audit/+page.svelte` | Interface : filtres, tableau, modal JSON |
| `src/routes/admin/audit/export/+server.ts` | Export CSV |

---

## Comportement en cas d'erreur

`insertAuditLog` avale silencieusement toute erreur DB. L'audit est une traçabilité secondaire : un échec d'insertion ne doit jamais bloquer l'action métier principale.

---

## À faire (hors périmètre initial)

- Purge automatique des entrées > 12 mois via Cron Trigger
- Audit des connexions admin (réussies et échouées)
- Audit des actions sur les comptes admins (création, suppression, reset password)
