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
| `{catégorie}/{section}/{id}/images/{filename}` | Images des questions (depuis R2) |

### Format des fichiers question

```markdown
---
difficulty: moyen
answerSize: md
applicableSupports: [deriveur, catamaran]
---

# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…
```

Le frontmatter YAML contient les métadonnées pédagogiques de la question :

| Champ | Valeurs possibles | Défaut | Description |
|---|---|---|---|
| `difficulty` | `facile`, `moyen`, `difficile` | `moyen` | Niveau de difficulté |
| `answerSize` | `xs`, `sm`, `md`, `lg` | `md` | Taille de réponse attendue |
| `applicableSupports` | liste de slugs entre `[]` | `[]` | Supports concernés (`[]` = tous) |

Les exports antérieurs sans frontmatter restent importables : les trois champs prennent alors leur valeur par défaut (`moyen`, `md`, `[]`).

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
difficulty: moyen
answerSize: md
applicableSupports: []
---

# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…

<small>Manuel FFV p.42</small>
```

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
| `only` | `"structure"`, `"questions"`, `"templates"`, `"images"` | Importer une partie seulement (optionnel, défaut : tout) |

Retourne un objet JSON avec les compteurs d'entités importées :

```json
{
  "supports": 2,
  "categories": 5,
  "sections": 18,
  "questions": 423,
  "templates": 6,
  "templateSlots": 42,
  "images": 87
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
