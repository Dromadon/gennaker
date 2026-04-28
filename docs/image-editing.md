# Gestion des images dans l'interface d'édition (US-12)

## Vue d'ensemble

L'édition d'une question (`/admin/questions/[id]/edit`) embarque un panneau images directement dans le formulaire. Ce panneau permet d'ajouter de nouvelles images, de les insérer dans le markdown, et de retirer des images existantes. La synchronisation avec R2 se fait entièrement à la sauvegarde.

---

## Flow complet

### 1. Chargement de la page

Le serveur (`+page.server.ts`, action `load`) :
1. Récupère la question depuis D1
2. Liste les objets R2 sous le préfixe `{questionId}/images/`
3. Passe les noms de fichiers (`existingImages: string[]`) au composant `QuestionForm`

Le composant affiche immédiatement les images existantes avec leurs miniatures servies via R2.

### 2. Ajouter une nouvelle image

1. L'utilisateur clique **"+ Ajouter"** → déclenche un `<input type="file" accept="image/*">` caché
2. Le fichier est stocké en mémoire dans `pendingImages : Map<string, { file, objectUrl }>`
3. Le nom de fichier est sanitisé (seuls `[a-zA-Z0-9._-]` sont conservés, le reste → `_`)
4. Un `objectURL` est créé pour la prévisualisation immédiate dans le renderer markdown
5. L'image apparaît dans la section **"Images ajoutées"** du panneau avec un indicateur ● orange

À ce stade, rien n'est envoyé au serveur.

### 3. Insérer une image dans le markdown

1. L'utilisateur clique **"Insérer"** sur une image du panneau
2. La référence markdown est insérée à la position du curseur dans le **dernier textarea focalisé** :
   - Énoncé → `![image_question](images/{filename})`
   - Correction → `![image_correction](images/{filename})`
3. La preview se met à jour en temps réel (les pending utilisent leur `objectURL`, les existantes leur URL R2)
4. Le bouton de l'image bascule de **"Insérer"** → **"Enlever"**

### 4. Enlever une image du markdown

1. L'utilisateur clique **"Enlever"**
2. Toutes les occurrences de `![...](images/{filename})` sont retirées du markdown (énoncé + correction)
3. L'image reste visible dans le panneau, avec son nom **barré** (pour les existantes) ou grisé (pour les ajoutées), et le bouton redevient **"Insérer"**
4. Aucune suppression R2 immédiate — c'est la sauvegarde qui nettoie

### 5. Sauvegarde

Le composant utilise `enhance` (SvelteKit) pour intercepter la soumission :

**Étape 1 — POST vers l'action `?/update`**
- Le markdown courant (avec les refs images à jour) est envoyé au serveur
- Le serveur calcule les images référencées dans le nouveau markdown via `extractImageRefs()`
- `deleteOrphanImages()` supprime de R2 toutes les images listées sous `{questionId}/images/` qui ne sont **plus** référencées
- Les erreurs de suppression R2 sont loguées mais non bloquantes (la question est sauvegardée quand même)

**Étape 2 — Upload des images pending (client)**
- Uniquement après succès D1 (type `'success'`)
- Seules les images **effectivement référencées dans le markdown courant** sont uploadées
- Une image ajoutée mais non insérée dans le texte n'est pas uploadée (filtre sur `currentImageRefs`)
- Chaque image est POSTée vers `POST /admin/questions/{id}/images`
- Après upload réussi, l'`objectURL` est révoqué
- En cas d'erreur partielle, un message d'avertissement s'affiche (la question est déjà sauvegardée)

**Étape 3 — Reload**
- `window.location.reload()` — le panneau est réinitialisé avec les images désormais stockées en R2

---

## Règles métier

| Règle | Comportement |
|-------|-------------|
| Image ajoutée non insérée dans le md | Non uploadée en R2, pas enregistrée |
| Image existante enlevée du md | Supprimée de R2 à la sauvegarde via `deleteOrphanImages` |
| Image ré-insérée après avoir été enlevée | Conservée en R2 (référencée → non orpheline) |
| Erreur upload R2 d'une image pending | Avertissement non bloquant, question sauvegardée |
| Erreur suppression R2 d'une orpheline | Loguée, non bloquante, question sauvegardée |
| Nouvelle image avec même nom qu'une existante | Dialog de confirmation orange affiché ; si confirmé, la pending remplace l'existante en R2 à la sauvegarde |
| Deux images pending avec le même nom (même session) | La seconde écrase la première silencieusement — remplacement intentionnel, pas de dialog |
| Conflit de nom résolu : preview | La pending prend la priorité sur l'existante dans la preview markdown (objectURL) |
| Deux questions avec la même image | Copies indépendantes sous `{id}/images/{fn}` |

---

## États du panneau images

### Section "Images existantes"

Présente les images listées depuis R2 au chargement. Toujours affichées, même si elles ont été enlevées du markdown.

| État | Apparence | Bouton |
|------|-----------|--------|
| Référencée dans le md | Nom normal, miniature nette | Enlever (rouge) |
| Non référencée (enlevée) | Nom barré, miniature atténuée | Insérer |

Texte d'avertissement affiché si au moins une image n'est plus référencée :
> _Les images enlevées seront supprimées lors de l'enregistrement._

### Section "Images ajoutées"

Présente les images ajoutées dans la session courante, avant upload. Toujours accompagnées du ● orange.

| État | Apparence | Bouton |
|------|-----------|--------|
| Insérée dans le md | Nom normal, miniature nette | Enlever (rouge) |
| Non insérée | Nom grisé, miniature atténuée | Insérer |

Texte d'avertissement affiché si au moins une image n'est pas insérée :
> _Les nouvelles images non insérées ne seront pas enregistrées._

---

## Endpoint d'upload

`POST /admin/questions/[id]/images` (`src/routes/admin/questions/[id]/images/+server.ts`)

Validations :
- Auth admin obligatoire → 403
- R2 disponible → 500
- ID numérique valide → 400
- Fichier présent et de type `image/*` → 400
- Taille max : 5 Mo → 400

Stockage : clé R2 `{questionId}/images/{filename}` (filename sanitisé côté serveur également)

Réponse : `{ filename: string }` (nom sanitisé)

---

## Fonctions utilitaires centralisées

### `extractImageRefs(md: string): Set<string>`

Définie dans `src/lib/markdown.ts`, source unique utilisée par :
- `src/lib/server/r2-images.ts` (re-export)
- `src/lib/components/ImagePanel.svelte` (import direct)

Regex interne :

```
/!\[.*?\]\(images\/([^)]+)\)/g
```

Le groupe capturé est le nom de fichier. Les URLs absolues (`https://`, `/questions-images/`) ne matchent pas et sont ignorées.

### `sanitizeFilename(name: string): string`

Définie dans `src/lib/images.ts`, source unique utilisée par :
- `src/routes/admin/questions/[id]/images/+server.ts` (upload endpoint)
- `src/lib/components/ImagePanel.svelte` (validation côté client avant dialog)

Règle : seuls `[a-zA-Z0-9._-]` sont conservés, tout autre caractère → `_`.

---

## Ce qui n'est pas couvert (hors périmètre US-12)

- Recadrage ou redimensionnement dans le navigateur
- Gestion de versions d'images
- Réorganisation d'images entre questions
- Upload multiple en une seule sélection
- Drag & drop
