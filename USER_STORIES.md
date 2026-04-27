# User Stories — Gennaker

## MVP

Le MVP couvre le flux principal : générer une évaluation, la consulter, la modifier et l'imprimer. Tout ce qui suit (partage, admin CRUD, soumissions, difficulté, épinglage, mobile) est hors périmètre MVP.

---

## Tâches techniques préalables

Ces tâches ne sont pas des user stories mais sont des prérequis bloquants.

| # | Tâche | |
|---|-------|---|
| T1 | Initialiser le projet SvelteKit avec `@sveltejs/adapter-cloudflare`, Tailwind CSS, TypeScript | ✅ |
| T2 | Configurer Cloudflare D1, écrire le schéma Drizzle (SQLite dialect), générer les migrations | ✅ |
| T3 | Écrire et exécuter `scripts/migrate-content.ts` : importer les 146 questions et 9 templates depuis `archive/` vers D1 | ✅ |
| T4 | Configurer Cloudflare R2 et migrer les images existantes | ✅ |
| T5 | Mettre en place l'authentification admin : formulaire login, vérification bcryptjs, cookie de session signé (HttpOnly/Secure), guard `admin/+layout.server.ts`, secrets Wrangler (`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`) | |

---

## Epic 1 — Génération d'une évaluation

### US-01 ✅ — Choisir un support et un format

**En tant que** stagiaire ou formateur,  
**je veux** choisir un support (dériveur, catamaran, windsurf) et un format (standard, raccourcie, positionnement),  
**afin de** générer une évaluation adaptée à mon contexte.

**Critères d'acceptation**
- La page d'accueil propose les supports actifs (croisière n'apparaît pas)
- Chaque support propose les 3 formats
- La sélection valide déclenche la génération et redirige vers la page évaluation
- Si aucun template n'existe pour la combinaison choisie, un message d'erreur clair est affiché

**Hors périmètre**
- Filtre par difficulté
- Personnalisation de la structure avant génération

---

### US-02 ✅ — Afficher l'évaluation générée

**En tant que** stagiaire ou formateur,  
**je veux** voir les questions tirées aléatoirement, organisées par catégorie et section,  
**afin de** consulter ou faire passer l'évaluation.

**Critères d'acceptation**
- Les questions sont affichées dans l'ordre défini par le template
- Chaque question affiche son titre et son énoncé (markdown rendu)
- Les images présentes dans l'énoncé s'affichent correctement
- Les catégories sont séparées par un en-tête visible
- Le tirage respecte les supports applicables de chaque question (une question catamaran-only n'apparaît pas dans une éval dériveur)
- Le tirage est aléatoire : deux générations successives produisent des questions différentes (dans la mesure où la banque le permet)

**Hors périmètre**
- Questions épinglées / par défaut
- Filtre par difficulté
- Exclusion inter-slots (une même question peut apparaître deux fois si la banque est petite — pas de logique d'exclusion en MVP)

---

### US-03 ✅ — Afficher et masquer la correction

**En tant que** stagiaire ou formateur,  
**je veux** afficher ou masquer la correction de toutes les questions en un clic,  
**afin de** contrôler ce que je révèle pendant l'entraînement ou la correction.

**Critères d'acceptation**
- Un toggle "Afficher la correction" est accessible en permanence (barre latérale ou barre fixe)
- La correction s'affiche sous l'énoncé de chaque question quand le toggle est actif
- Les images présentes dans la correction s'affichent correctement
- L'état du toggle ne persiste pas entre les sessions

---

### US-04 ✅ — Masquer les titres de catégories et/ou de sections à l'impression

**En tant que** formateur,  
**je veux** choisir de masquer les titres de catégories, les titres de sections, ou les deux lors de l'impression,  
**afin de** produire un document plus neutre pour les candidats sans altérer la lisibilité à l'écran.

**Critères d'acceptation**
- Deux toggles distincts sont accessibles dans le header : "Masquer catégories" et "Masquer sections"
- Ces toggles n'affectent que l'impression — les titres restent toujours visibles à l'écran
- Quand "Masquer catégories" est actif, les en-têtes de catégorie n'apparaissent pas à l'impression
- Quand "Masquer sections" est actif, les titres de section n'apparaissent pas à l'impression
- Les deux toggles peuvent être combinés
- L'état par défaut est "affiché" (toggles inactifs)

---

## Epic 2 — Modification de l'évaluation

### US-05 ✅ — Voir la structure de l'évaluation dans le panneau latéral

**En tant que** formateur,  
**je veux** voir la liste des slots de mon évaluation dans un panneau latéral,  
**afin d'** avoir une vue d'ensemble de la structure et d'accéder rapidement aux actions de modification.

**Critères d'acceptation**
- Sur écran large (≥ 1024px), le panneau est visible en permanence à gauche
- Sur écran étroit, le panneau est accessible via un bouton flottant (tiroir)
- Chaque slot affiche : catégorie, section, nombre de questions
- Les titres de catégories dans le panneau sont cliquables et font défiler l'évaluation jusqu'à la catégorie correspondante (smooth scroll)
- Sur mobile, le tiroir se ferme automatiquement lors du clic sur une catégorie

**Hors périmètre**
- Ajouter / supprimer des slots (post-MVP)
- Modifier le nombre de questions d'un slot (post-MVP)
- Synchronisation dynamique du panneau après re-tirage (post US-06/07)

---

### US-07 ✅ — Re-tirer une question individuelle

**En tant que** stagiaire ou formateur,  
**je veux** re-tirer une question spécifique dans un slot,  
**afin de** remplacer une question trop vue ou inadaptée sans toucher aux autres.

**Critères d'acceptation**
- Un bouton "Re-tirer cette question" est disponible sur chaque question dans la vue principale
- Le re-tirage remplace uniquement cette question par une autre tirée aléatoirement dans la même section
- Les questions tirées respectent les supports applicables
- Si aucune autre question n'est disponible dans la section, un message l'indique

**Hors périmètre**
- Sélection manuelle de la question de remplacement (post-MVP)

---

## Epic 3 — Impression

### US-08 ✅ — Imprimer l'évaluation

**En tant que** formateur,  
**je veux** imprimer l'évaluation dans un format propre, sans coupure au milieu d'une question,  
**afin de** la distribuer aux candidats lors de l'examen.

**Critères d'acceptation**
- Un bouton "Imprimer" déclenche la boîte de dialogue d'impression du navigateur
- Aucune question n'est coupée entre deux pages (CSS `break-inside: avoid`)
- L'espace de réponse (lignes vides sous l'énoncé, proportionnel à `answer_size`) apparaît automatiquement à l'impression sans être visible à l'écran
- La barre latérale et les contrôles UI sont masqués à l'impression
- Le document est nommé `Evaluation-{support}-{format}-{date}`
- La correction est imprimée ou non selon l'état du toggle au moment de l'impression
- Les images s'impriment correctement

---

## Epic 4 — Sauvegarde et DRP

### US-09 ✅ — Exporter le contenu en ZIP (backup on-demand)

**En tant que** administrateur,  
**je veux** télécharger un export complet du contenu (questions et images) en un clic,  
**afin de** pouvoir reconstruire la base de données et les médias depuis zéro en cas de sinistre.

**Critères d'acceptation**
- Un endpoint admin `GET /admin/export` génère et retourne un fichier ZIP
- Le ZIP contient toutes les questions au format markdown, organisées en `{catégorie}/{section}/{id}/{titre}.md`, avec l'énoncé et la correction séparés par `# Correction`
- Le ZIP contient toutes les images depuis R2, co-localisées avec le markdown (`{catégorie}/{section}/{id}/images/{fichier}`)
- Le ZIP contient un fichier `templates.json` décrivant les templates et leurs slots
- Le fichier est nommé `gennaker-backup-{YYYY-MM-DD}.zip`
- L'endpoint est protégé par l'authentification admin existante
- La génération ne dépasse pas les limites CPU/mémoire d'un Worker (streaming si nécessaire)

**Hors périmètre**
- Planification automatique depuis l'interface
- Backup incrémental
- Logs et monitoring de l'export (voir US-09b)

---

### US-09b — Visualiser les logs et erreurs durant l'export

**En tant que** administrateur,  
**je veux** voir la progression et les erreurs détaillées lors de l'export en ZIP,  
**afin de** diagnostiquer et corriger les problèmes sans avoir à consulter les logs Cloudflare.

**Critères d'acceptation**
- Une page admin dédiée affiche la progression de l'export en temps réel (nombre de questions traitées, d'images uploadées, etc.)
- Les erreurs sont listées avec détails : fichier concerné, type d'erreur, timestamp
- La page présente un résumé final : nombre total de questions, d'images, d'erreurs, durée totale
- Un historique des 10 derniers exports est conservé (timestamp, status, nb erreurs)
- Les erreurs graves (ex. plus de 10 % d'images manquantes) déclenchent une alerte visible

**Hors périmètre**
- Relancement automatique d'une question en erreur
- Retry configurables

---

### US-10 — Synchronisation automatique vers S3 (backup DRP)

**En tant que** administrateur,  
**je veux** que le contenu soit automatiquement synchronisé vers un bucket Scaleway S3 chaque semaine,  
**afin de** disposer d'une copie hors Cloudflare permettant une reconstruction sans intervention manuelle.

**Critères d'acceptation**
- Un Cloudflare Cron Trigger déclenche la synchronisation chaque semaine (ex. dimanche 02h00 UTC)
- Le job exporte toutes les questions en JSON (`questions.json`) et les templates (`templates.json`) vers S3
- Le job synchronise les objets R2 vers le bucket Scaleway (seuls les objets modifiés ou absents sont transférés)
- Les credentials Scaleway (endpoint, access key, secret key, bucket) sont stockés en secrets Wrangler
- En cas d'échec partiel, le job continue et loggue les erreurs (pas d'arrêt total)
- Le résultat (nb objets synchronisés, nb erreurs) est loggué dans les Cloudflare Logs

**Hors périmètre**
- Interface de consultation des backups depuis l'admin
- Restauration automatisée depuis S3

---

## Chores techniques

| ID | Description |
|----|-------------|
| C-01 | Supprimer les scripts de migration one-shot (`scripts/migrate-content.ts`, `scripts/migrate-images.ts`, `scripts/download-lfs-images.sh`) et le dossier `archive/` une fois la base de données de prod alimentée et les images uploadées sur R2 |

---

## Post-MVP (backlog)

Les stories suivantes sont identifiées mais hors scope MVP, classées par priorité approximative.

| Priorité | Story |
|----------|-------|
| 1 | Partage d'une évaluation via lien court (short code, expiration 30 jours) |
| 2a | US-11 : Interface admin — CRUD questions sans images (voir ci-dessous) |
| 2b | US-12 : Interface admin — Gestion des images dans le CRUD questions (voir ci-dessous) |
| 2c | US-13 : Sources des questions — affichage et gestion (voir ci-dessous) |
| 3 | Interface admin : gestion des templates et slots |
| 4 | Modification de structure : ajouter / supprimer un slot dans une évaluation |
| 4b | US-06 : Re-tirer toutes les questions d'un slot (bouton par slot dans le panneau latéral) |
| 5 | Sélection manuelle d'une question dans la banque |
| 6 | Gestion de la difficulté des questions (annotation + filtre au tirage) |
| 7 | Questions épinglées et questions par défaut dans les templates |
| 8 | Banque publique de questions (consultation filtrée) |
| 9 | Soumission communautaire de questions |
| 10 | Signalement d'un problème sur une question |
| 11 | Interface admin : modération des soumissions |

---

### US-11 — Interface admin : CRUD questions (sans images)

**En tant que** administrateur,  
**je veux** lister, créer, modifier et supprimer des questions depuis l'interface admin,  
**afin de** maintenir la banque de questions sans passer par des scripts SQL.

**Critères d'acceptation**

_Liste_
- La page `/admin/questions` liste toutes les questions avec : titre, catégorie, section, difficulté, status (brouillon / publié), nombre de supports applicables
- Des filtres permettent de restreindre la liste : catégorie, section, support applicable, status
- La liste est paginée (20 questions par page) et triée par catégorie → section → id par défaut
- Chaque ligne propose des liens directs vers modifier et supprimer

_Création_
- Le formulaire `/admin/questions/new` expose tous les champs éditables : titre, catégorie/section (sélecteurs liés), difficulté, answer_size, supports applicables (checkboxes), status, source
- L'énoncé et la correction sont saisis dans deux zones markdown distinctes, chacune avec une preview en temps réel côte à côte (rendu via `createMarkdownRenderer`)
- La soumission crée la question en D1 avec `created_at` et `updated_at` à l'heure courante, et en statut brouillon
- En cas d'erreur de validation, les champs sont conservés et les erreurs affichées inline

_Modification_
- Le formulaire `/admin/questions/{id}/edit` est pré-rempli avec les valeurs actuelles
- La soumission met à jour la question et rafraîchit `updated_at`
- Un lien "Voir dans une évaluation" permet de prévisualiser la question hors du formulaire

_Suppression_
- La suppression est déclenchée depuis la liste ou le formulaire d'édition
- Une confirmation explicite est demandée (dialog ou page de confirmation) avec une saisie utilisateur d'un slug de la question
- La suppression efface la question de D1 ; les images R2 associées ne sont **pas** touchées par cette story (voir US-12)


**Hors périmètre**
- Upload, affichage et suppression d'images (voir US-12)
- Éditeur WYSIWYG avec insertion d'images (voir US-12)
- Historique des modifications
- Import en masse
- Si la question est référencée dans `preferred_question_ids` ou comme `pinned_question_id` d'un slot, un avertissement est affiché avant confirmation
---

### US-12 — Interface admin : gestion des images dans le CRUD questions

**En tant que** administrateur,  
**je veux** pouvoir uploader, prévisualiser et supprimer les images d'une question directement depuis l'interface d'édition,  
**afin de** gérer l'intégralité du contenu d'une question sans intervention manuelle sur R2.

**Critères d'acceptation**

_Éditeur_
- L'éditeur markdown (énoncé et correction) expose un bouton "Insérer une image" qui ouvre un sélecteur de fichier
- L'image sélectionnée est uploadée immédiatement vers R2 via un endpoint dédié (`POST /admin/questions/{id}/images`) qui utilise le binding R2 du Worker (pas de clé S3)
- L'upload insère automatiquement la référence `![alt](images/{filename})` à la position du curseur
- L'image uploadée est visible dans la preview markdown en temps réel (résolution via `createMarkdownRenderer`)
- Les images déjà associées à la question sont listées dans un panneau latéral avec miniature

_À la création_
- L'upload d'images n'est disponible qu'après la première sauvegarde (la clé R2 nécessite l'`id` de la question)
- Un flux alternatif propose : sauvegarder en brouillon → uploader les images → publier

_À la modification_
- Lors de la sauvegarde, le serveur compare les références `images/{fn}` dans le markdown avant/après
- Les images déréférencées (référencées dans l'ancien markdown mais absentes du nouveau) sont supprimées de R2 (`r2.delete(key)`) — la clé est reconstruite depuis `{cat}/{sec}/{id}/images/{fn}`
- Si la suppression R2 échoue, la sauvegarde continue ; l'erreur est loguée et remontée en avertissement non bloquant

_À la suppression de la question_
- Toutes les images R2 associées (listées dans `question_images`) sont supprimées de R2 avant la suppression D1
- Si une suppression R2 échoue, l'administrateur en est informé et peut forcer la suppression

_Clé R2_
- Les images sont stockées sous `{categorySlug}/{sectionSlug}/{questionId}/images/{filename}` — même convention que le renderer et l'export ZIP
- Pas de table catalogue : les images d'une question sont toujours dérivées de son markdown

**Hors périmètre**
- Recadrage ou redimensionnement d'image dans le browser
- Gestion de versions d'images
- Réorganisation des images entre questions

---

### US-13 — Sources des questions — affichage et gestion

**En tant que** administrateur ou lecteur d'une évaluation,  
**je veux** voir et gérer les sources des questions (auteur, examen d'origine, date, etc.),  
**afin de** créditer les sources et maintenir la traçabilité du contenu.

**Critères d'acceptation**

_Admin : édition_
- Le champ source du formulaire d'édition US-11 est renommé de `sourceMd` à `source` et utilise un champ texte simple (pas de markdown)
- Format libre : "Examen fédéral 2023, question 42" ou "D'après Cousteau, Manuel de voile 1995"
- Optionnel (peut être vide)

_Affichage public_
- Sur une question affichée dans une évaluation (`/evaluation`), la source apparaît sous la correction
  dans une petite zone grisée (footNote style) : `Source : {source}`
- Invisible si le champ est vide
- Format : juste du texte, pas de markdown

_Admin : visualisation_
- Sur la page liste `/admin/questions`, une colonne "Source" affiche un aperçu tronqué (premiers 40 caractères)
- La source complète est visible au survol (tooltip) ou dans le formulaire d'édition

**Hors périmètre**
- Parsing de la source (extraction d'auteur, date) — stockage texte libre uniquement
- Liens hypertextes dans la source — texte brut seulement
- Historique des sources modifiées
