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

La structure décrit l'arborescence complète des catégories et sections pour permettre une reconstruction correcte du modèle de données lors d'une restauration.

- `applicableSupports` est un tableau vide (`[]`) si la catégorie/section s'applique à tous les supports, sinon contient les slugs des supports applicables.

## Utilisation

Depuis l'interface admin (`/admin`) → bouton **Télécharger le backup**.

## Reconstruction depuis un backup

1. Re-créer les tables : `npm run db:migrate:remote`
2. Importer la structure (catégories et sections) : adapter `scripts/migrate-content.ts` pour lire `structure.json` et créer les entrées dans les tables `categories` et `sections`
3. Importer les questions : adapter le script pour lire les fichiers `.md` et créer les entrées dans `questions`
4. Importer les templates : adapter le script pour lire `templates.json` et créer les entrées dans `evaluation_templates` et `template_slots`
5. Uploader les images R2 : `wrangler r2 object put <bucket>/<key> --file <file> --remote` pour chaque image du dossier `{catégorie}/{section}/{id}/images/`
