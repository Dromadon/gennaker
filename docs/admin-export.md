# Admin — Export de sauvegarde (US-09)

## Endpoint

```
GET /admin/export
```

Requiert une session admin active (cookie `admin_session`). Retourne un fichier ZIP nommé `gennaker-backup-{YYYY-MM-DD}.zip`.

## Contenu du ZIP

| Chemin dans le ZIP | Contenu |
|--------------------|---------|
| `{catégorie}/{section}/{id}/{titre}.md` | Énoncé + correction séparés par `# Correction` |
| `templates.json` | Tous les templates et leurs slots (JSON) |
| `structure.json` | Catégories et sections avec métadonnées (slugs, displayNames, applicableSupports) |
| `reports.json` | Tous les signalements de questions (JSON) |
| `{catégorie}/{section}/{id}/images/{filename}` | Images des questions (depuis R2) |

### Format des fichiers question

```markdown
---
status: publie
difficulty: moyen
answerSize: md
applicableSupports: [deriveur, catamaran]
createdAt: 1700000000
updatedAt: 1700000001
---

# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…
```

Le frontmatter YAML contient les métadonnées de la question :

| Champ | Valeurs possibles | Défaut | Description |
|---|---|---|---|
| `status` | `publie`, `brouillon` | `publie` | Statut éditorial |
| `difficulty` | `facile`, `moyen`, `difficile` | `moyen` | Niveau de difficulté |
| `answerSize` | `xs`, `sm`, `md`, `lg`, `xl` | `md` | Taille de réponse attendue |
| `applicableSupports` | liste de slugs entre `[]` | `[]` | Supports concernés (`[]` = tous) |
| `createdAt` | timestamp Unix (entier) | `now` à l'import | Date de création originale |
| `updatedAt` | timestamp Unix (entier) | `now` à l'import | Date de dernière modification |

Les exports antérieurs sans ces champs restent importables : `status` prend `publie`, `createdAt`/`updatedAt` prennent la date courante de l'import.

### Format de `templates.json`

```json
[
  {
    "id": 1,
    "supportSlug": "deriveur",
    "format": "standard",
    "slots": [
      {
        "id": 10,
        "categorySlug": "meteo",
        "sectionSlug": "carte_meteo",
        "position": 1,
        "questionCount": 1,
        "difficultyFilter": "any",
        "pinnedQuestionId": null,
        "preferredQuestionIds": "[]"
      }
    ]
  }
]
```

- `categorySlug` est requis pour désambiguïser les sections dont le slug n'est pas unique (ex : `divers` existe dans plusieurs catégories). Il est présent depuis le 2026-04-28.
- `sectionId` n'est pas exporté — les IDs numériques sont propres à chaque instance DB et ne sont pas portables.

### Format de `structure.json`

```json
{
  "supports": [
    { "slug": "deriveur", "displayName": "Dériveur", "enabled": true }
  ],
  "categories": [
    {
      "slug": "securite",
      "displayName": "Sécurité",
      "applicableSupports": [],
      "sections": [
        {
          "slug": "feux",
          "displayName": "Feux et signaux",
          "applicableSupports": []
        }
      ]
    }
  ]
}
```

- `applicableSupports` est un tableau vide (`[]`) si la catégorie/section s'applique à tous les supports, sinon contient les slugs des supports applicables.
- `supports` liste tous les supports avec leur état d'activation.

### Format des fichiers question avec source

Quand une question a un champ `sourceMd`, il est inclus après la correction :

```markdown
---
status: publie
difficulty: moyen
answerSize: md
applicableSupports: []
createdAt: 1700000000
updatedAt: 1700000001
---

# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…

<small>Manuel FFV p.42</small>
```

### Format de `reports.json`

```json
[
  {
    "id": 1,
    "questionId": 42,
    "problemType": "enonce_incorrect",
    "description": "L'énoncé contient une erreur.",
    "email": "contact@example.com",
    "status": "nouveau",
    "createdAt": 1700000000
  }
]
```

| Champ | Description |
|---|---|
| `id` | Identifiant du signalement (préservé à l'import pour idempotence) |
| `questionId` | ID de la question signalée |
| `problemType` | Type de problème : `enonce_incorrect`, `correction_incorrecte`, `question_doublon`, `mise_en_forme`, `autre` |
| `description` | Description libre (peut être `null`) |
| `email` | Email de contact (peut être `null`) |
| `status` | `nouveau` ou `resolu` |
| `createdAt` | Timestamp Unix de création |

Les ZIPs antérieurs sans `reports.json` sont importables sans erreur : aucun signalement n'est importé.

## Utilisation

Depuis l'interface admin (`/admin`) → bouton **Télécharger le backup**.

## Import — endpoint

```
POST /admin/import
```

Requiert une session admin active (cookie `admin_session`). Reçoit un formulaire multipart :

| Champ | Type | Description |
|-------|------|-------------|
| `file` | Fichier ZIP | Le backup à importer |
| `wipe` | `"true"` / `"false"` | Vider toutes les tables avant l'import (optionnel, défaut `false`) |
| `only` | `"structure"`, `"questions"`, `"templates"`, `"images"`, `"reports"` | Importer une partie seulement (optionnel, défaut : tout) |

Retourne un objet JSON avec les compteurs d'entités importées :

```json
{
  "supports": 2,
  "categories": 5,
  "sections": 18,
  "questions": 423,
  "templates": 6,
  "templateSlots": 42,
  "images": 87,
  "reports": 47
}
```

L'import est idempotent : relancer avec le même ZIP ne duplique pas les données (upsert sur les clés uniques).

## Reconstruction depuis un backup

Le script CLI `scripts/import-export.ts` appelle l'endpoint `/admin/import` en HTTP. Il nécessite `ADMIN_SESSION_TOKEN` dans `.env.local` (voir [dev-setup.md](dev-setup.md)).

**Le serveur doit être démarré avant de lancer le script (`npm run dev` pour le local).**

```bash
# Dev local (cumule avec l'existant)
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip

# Dev local avec wipe complet avant import
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip --wipe

# Production (sans wipe — cumule avec l'existant)
npm run prod:seed -- --file gennaker-backup-YYYY-MM-DD.zip

# Production (wipe complet avant import — pour corriger une corruption)
# ⚠️ Demande une confirmation interactive (saisir "oui")
npx tsx scripts/import-export.ts --remote --wipe --file gennaker-backup-YYYY-MM-DD.zip
```

Voir [dev-setup.md](dev-setup.md) pour le détail complet du setup et des sous-commandes disponibles.
