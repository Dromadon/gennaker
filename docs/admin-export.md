# Admin — Export de sauvegarde (US-09)

## Endpoint

```
GET /admin/export
```

Requiert une session admin active (cookie `admin_session`). Retourne un fichier ZIP nommé `gennaker-backup-{YYYY-MM-DD}.zip`.

## Contenu du ZIP

| Chemin dans le ZIP | Contenu |
|--------------------|---------|
| `questions/{catégorie}/{section}/{titre}.md` | Énoncé + correction séparés par `# Correction` |
| `templates.json` | Tous les templates et leurs slots (JSON) |
| `images/{catégorie}/{section}/images/{filename}` | Images des questions (depuis R2) |

### Format des fichiers question

```markdown
# Titre de la question

Énoncé en markdown…

# Correction

Correction en markdown…
```

## Utilisation

Depuis l'interface admin (`/admin`) → bouton **Télécharger le backup**.

## Reconstruction depuis un backup

1. Re-créer les tables : `npm run db:migrate:remote`
2. Uploader les images R2 : `wrangler r2 object put <bucket>/<key> --file <file> --remote` pour chaque image du dossier `images/`
3. Importer les questions : adapter `scripts/migrate-content.ts` pour lire les fichiers `.md` du dossier `questions/`
4. Importer les templates : adapter le script pour lire `templates.json`
