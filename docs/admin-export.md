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
# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…
```

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
# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…

<small>Manuel FFV p.42</small>
```

## Utilisation

Depuis l'interface admin (`/admin`) → bouton **Télécharger le backup**.

## Reconstruction depuis un backup

Pour peupler un environnement (dev ou production) depuis un export ZIP :

```bash
# Dev local
npm run dev:seed -- --file gennaker-backup-YYYY-MM-DD.zip

# Production
npm run prod:seed -- --file gennaker-backup-YYYY-MM-DD.zip
```

Voir [dev-setup.md](dev-setup.md) pour le détail complet du setup et des sous-commandes disponibles.
