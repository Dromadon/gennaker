# QuestionForm — Contrat du composant

Composant unifié pour la création et la modification d'une question. Gère les métadonnées, les éditeurs markdown avec preview, et le panneau de gestion des images.

## Props

| Prop | Type | Obligatoire | Description |
|------|------|-------------|-------------|
| `categories` | `CategoryWithSections[]` | oui | Liste des catégories et sections disponibles |
| `question` | `Partial<QuestionAdminDetail>` | non | Valeurs initiales (absence = mode création) |
| `errors` | `Record<string, string[]>` | non | Erreurs de validation serveur à afficher |
| `action` | `string` | oui | URL de l'action de formulaire (`?/create` ou `?/update`) |
| `questionId` | `number \| undefined` | non | ID de la question (absent en création avant 1ère sauvegarde) |
| `existingImages` | `string[]` | non | Noms de fichiers des images déjà présentes sur R2 |
| `r2BaseUrl` | `string` | oui | Base URL publique R2 pour résoudre les images existantes |

## État interne clé

### `pendingImages : Map<filename, { file: File, objectUrl: string }>`

Images sélectionnées par l'admin mais pas encore uploadées sur R2. Alimenté à la sélection d'un fichier via `<input type="file">`. Purgé après upload R2 réussi (post-sauvegarde). Si un filename correspond à une image existante, il écrase silencieusement l'entrée (pas de warning — comportement intentionnel).

### `currentImageRefs : Set<filename>` (dérivé)

Union des refs `images/{fn}` extraites de `questionMd` et `correctionMd` courants. Sert à filtrer ce qui s'affiche dans le panneau et à déterminer ce qui sera supprimé de R2 au save.

## Comportements

### Insertion au curseur

- Le bouton "Insérer" d'une image insère le texte markdown à la position `selectionStart` du textarea actif
- Si l'onglet actif est **Énoncé** : insère `![image](images/{fn})`
- Si l'onglet actif est **Correction** : insère `![image_correction](images/{fn})`
- Le curseur se positionne après le texte inséré

### Preview locale (avant sauvegarde)

La preview utilise `createLocalMarkdownRenderer(pendingImages, questionId, r2BaseUrl)` :
- Les images `pendingImages` sont affichées via leur `objectUrl` (blob URL)
- Les images existantes sont résolues vers `{r2BaseUrl}/{questionId}/images/{fn}`
- Priorité : `pendingImages` > R2 (en cas de conflit de nom, la version locale s'affiche)

Quand `questionId` est absent (création avant 1ère sauvegarde), les images existantes ne peuvent pas être résolues vers R2 — seules les `pendingImages` sont affichables.

### Conflits de nom

Si l'admin sélectionne un fichier dont le nom correspond à une image existante :
- `pendingImages` est mis à jour avec le nouveau fichier (écrase l'entrée précédente)
- La preview affiche immédiatement la nouvelle image via objectUrl
- À la sauvegarde, R2 est écrasé silencieusement (même clé)
- Pas de message d'avertissement

### Flow sauvegarde

Le submit est intercepté (`preventDefault`) et orchestré en fetch :

1. `fetch` de l'action (`?/create` ou `?/update`) avec les données du formulaire → D1
2. Si création : récupère l'`id` retourné dans la réponse
3. Si succès D1 → upload en parallèle de chaque entrée `pendingImages` via `POST /admin/questions/{id}/images`
4. `URL.revokeObjectURL` pour libérer chaque blob URL
5. Reload de la page pour synchroniser `existingImages` depuis le serveur

### Cas d'erreur

- **Erreur validation D1** : les erreurs serveur sont affichées inline (comportement inchangé)
- **Upload R2 partiel** : si certains uploads échouent après succès D1, la page se recharge normalement et un avertissement non bloquant est affiché. Le markdown D1 référence des images absentes de R2 — l'admin peut retenter en ré-sélectionnant les fichiers manquants.
- **Aucun `questionId` au moment du submit** (création) : l'`id` est extrait de la réponse de l'action `create` avant de lancer les uploads.

## Panneau images

Affiché sous les éditeurs markdown. Contient :

- Un bouton "+ Ajouter une image" qui déclenche un `<input type="file" accept="image/*">` caché
- Pour chaque image visible (`existingImages` filtrées à celles référencées dans le md courant + `pendingImages`) :
  - Miniature 30×30px (objectUrl si en attente, URL R2 si existante)
  - Nom de fichier (tronqué à 20 caractères si nécessaire)
  - Bouton "Insérer"
  - Badge orange "●" si l'image est dans `pendingImages` (en attente d'upload)

Les images présentes en R2 mais **non référencées dans le md** sont invisibles dans le panneau. Elles seront supprimées de R2 au prochain save (filet de sécurité contre les orphelines).
