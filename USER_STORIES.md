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
| T6 | Tests d'intégration D1 : configurer `@cloudflare/vitest-pool-workers` (miniflare) et écrire 5 scénarios critiques end-to-end contre une vraie base D1 locale (voir détail ci-dessous) | |

**T6 — Détail des 5 scénarios**

1. **Modifier une question** : mettre à jour `question_md` via la query admin, vérifier que la modification est persistée et retournée par `getQuestionById`.
2. **Écrire un signalement et le résoudre** : appeler `createReport`, vérifier qu'il apparaît dans `getReportsAdmin({ status: 'nouveau' })`, appeler `updateReportStatus('resolu')`, vérifier qu'il n'apparaît plus dans les nouveaux et apparaît dans les résolus.
3. **Soumettre une question et l'accepter** : créer une `community_submission`, vérifier son statut `en_attente`, la passer en `approuve`, vérifier que la question correspondante est créée (ou le statut mis à jour selon le flux retenu).
4. **Générer une évaluation** : appeler la logique de tirage pour un support + format donné, vérifier que le résultat contient le bon nombre de questions et qu'elles respectent les filtres de section et de support applicable.
5. **Compte des signalements en attente** : `countPendingReports` retourne le bon delta après création et résolution de signalements.
6. **Exporter et importer des données** : appeler la logique d'export, wipe la db puis faire l'import et vérifier que les données ont bien toutes été restaurées.

**Mise en œuvre**

Créer `vitest.int.config.ts` avec `@cloudflare/vitest-pool-workers` (Miniflare) et la config D1 pointant vers les migrations `drizzle/migrations/`. Les tests `*.int.test.ts` sont déjà exclus de `vitest.config.ts` — la convention de nommage est posée. Chaque test doit appliquer les migrations sur une D1 vierge en setup, puis wiper entre chaque cas.

**Pourquoi faire T6 maintenant** : le script d'import one-shot des données manquantes (difficulty, answerSize, applicableSupports) génère du SQL exécuté en production. Avoir une D1 réelle en test avant d'écrire ce script garantit que le SQL est syntaxiquement valide, que les migrations sont cohérentes avec le schéma Drizzle, et que les données relues après import sont identiques aux données exportées. Les tests de roundtrip actuels (`roundtrip.test.ts`) vérifient la sérialisation mais pas l'exécution SQL.

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
- Questions épinglées / par défaut (voir US-21 et US-22)
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
- Le ZIP contient un fichier `structure.json` décrivant les catégories et sections avec leurs métadonnées (slugs, order, etc.)
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
| 2c | US-13 : Sources des questions — affichage et gestion (voir ci-dessous) |
| 3 | Interface admin : gestion des templates et slots |
| 4 | Modification de structure : ajouter / supprimer un slot dans une évaluation |
| 4b | US-06 : Re-tirer toutes les questions d'un slot (bouton par slot dans le panneau latéral) |
| 4c | US-17 : Ajuster le nombre de questions par section après génération (voir ci-dessous) |
| 4c | US-17 : Choisir le nombre de questions par section lors de la création d'une évaluation (voir ci-dessous) |
| 6 | Gestion de la difficulté des questions (annotation + filtre au tirage) |
| 7 | US-21 : Épingler une question sur un slot de template (voir ci-dessous) |
| 7 | US-22 : Définir des questions par défaut sur un slot de template (voir ci-dessous) |
| 9 | US-18 : Soumission communautaire de questions |
| 11 | US-19 : Interface admin : modération des soumissions |

---

### US-11 ✅ — Interface admin : CRUD questions (sans images)

**En tant que** administrateur,  
**je veux** lister, créer, modifier et supprimer des questions depuis l'interface admin,  
**afin de** maintenir la banque de questions sans passer par des scripts SQL.

**Critères d'acceptation**

_Liste et prévisualisation_
- La page `/admin/questions` liste toutes les questions avec filtres (catégorie, section, support, statut) et pagination (20 par page)
- Cliquer sur une ligne ouvre un panneau de prévisualisation à droite (layout deux colonnes) ; le tableau se réduit à l'ID et au titre
- Le panneau affiche les boutons **Modifier** (lien vers `/admin/questions/{id}/edit`) et **Supprimer** (dialog de confirmation) au-dessus de la preview de la question
- La preview réutilise le composant `QuestionPreview` (également utilisé dans `/admin/reports` et la banque publique)
- Une section dépliable en bas du panneau liste les signalements rattachés à la question (type, date, statut) ; s'il n'y en a pas, un message "Aucun signalement" est affiché
- Les signalements sont chargés en une seule requête groupée au load (via `getReportsByQuestionIds`), sans N+1
- Fermer le panneau (bouton ✕) revient au tableau pleine largeur avec toutes les colonnes

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

### US-12 ✅ — Interface admin : gestion des images dans le CRUD questions

**En tant que** administrateur,  
**je veux** pouvoir insérer et gérer les images d'une question directement depuis l'interface d'édition,  
**afin de** gérer l'intégralité du contenu d'une question sans intervention manuelle sur R2.

**Critères d'acceptation**

_Panneau images (modification)_
- Un panneau liste toutes les images : existantes (chargées depuis R2) et nouvellement ajoutées (en attente d'upload), avec miniature
- Les images existantes non référencées dans le markdown apparaissent avec leur nom barré et un bouton "Insérer"
- Les images existantes référencées affichent un bouton "Enlever" qui retire la ref du markdown sans supprimer l'image immédiatement
- Les nouvelles images non insérées affichent un avertissement et ne sont pas uploadées à la sauvegarde
- Un texte avertit que les images enlevées seront supprimées lors de l'enregistrement

_Insertion dans le markdown_
- Cliquer "Insérer" insère `![image_question](images/{filename})` dans l'énoncé ou `![image_correction](images/{filename})` dans la correction, selon le dernier textarea focalisé
- L'image insérée est visible dans la preview markdown en temps réel (objectURL pour les pending, URL R2 pour les existantes)

_Sauvegarde (modification)_
- Seules les nouvelles images **effectivement référencées** dans le markdown sont uploadées vers R2
- Les images qui ne sont plus référencées dans le markdown sauvegardé sont supprimées de R2 (`deleteOrphanImages`)
- Les erreurs R2 (upload ou suppression) sont non bloquantes : la question est sauvegardée, un avertissement est affiché

_Suppression de la question_
- Toutes les images R2 associées sont supprimées **avant** la suppression en D1
- Si la suppression R2 échoue, l'administrateur en est informé et la suppression D1 est bloquée

**Hors périmètre**
- Recadrage ou redimensionnement d'image dans le navigateur
- Gestion de versions d'images
- Réorganisation des images entre questions
- Upload multiple en une seule sélection

**Documentation détaillée** : `docs/image-editing.md`

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

---

### US-14 ✅ — Sélection manuelle d'une question dans la banque

**En tant que** formateur,  
**je veux** sélectionner manuellement une question spécifique dans la banque pour remplacer une question d'un slot,  
**afin de** choisir précisément les questions adaptées à mon contexte sans dépendre du hasard du re-tirage.

**Critères d'acceptation**

_Déclenchement_
- À côté du bouton "Re-tirer cette question" (US-07), un bouton "Choisir une question" ouvre une modale de sélection
- La modale affiche un formulaire de recherche et filtrage

_Recherche et filtrage_
- Un champ texte permet de chercher par titre ou énoncé (recherche fulltext)
- Les questions sont filtrées sur la base de la catégorie et section concernées et du support choisi
- La liste affiche les questions correspondantes avec : titre, difficulté
- Les questions actuellement présentes ailleurs dans l'évaluation sont marquées distinctement (ex. icône "déjà utilisée")

_Sélection_
- Cliquer sur une question la sélectionne et remplace immédiatement la question du slot
- Un message de confirmation très court s'affiche ("Question remplacée")
- La modale se ferme automatiquement après la sélection
- La question tirée aléatoirement est conservée en mémoire (permet un retour arrière via annulation)

_Sauvegarde et état_
- La modification n'est pas sauvegardée automatiquement — elle ne persiste que dans la session courante
- L'évaluation reste modifiable normalement après sélection manuelle (re-tirage possible, etc.)

**Hors périmètre**
- Persistance des sélections manuelles entre sessions (c.-à-d. les modifications ne sont sauvegardées que pendant la session)
- Historique des sélections manuelles
- Possibilité de sélectionner des questions d'une autre catégorie ou section
- Tri ou tri personnalisé de la liste de recherche (tri par défaut : pertinence fulltext)

---

### US-15 ✅ — Banque publique de questions (consultation filtrée)

**En tant que** stagiaire ou formateur,  
**je veux** consulter la banque de questions avec les mêmes filtres que l'interface admin,  
**afin de** explorer les questions disponibles et prévisualiser leur contenu avant ou après une évaluation.

**Critères d'acceptation**

_Liste_
- La page `/questions` liste toutes les questions publiées (statut `published`) avec : titre, catégorie, section, difficulté, supports applicables
- Les mêmes filtres que `/admin/questions` sont disponibles : catégorie, section, support applicable
- La liste est paginée (20 questions par page) et triée par catégorie → section → id par défaut
- Aucun lien de modification ou suppression n'est affiché

_Filtrage_
- Les filtres catégorie et section sont liés : sélectionner une catégorie restreint les sections disponibles
- Le filtre support est une liste déroulante ou un groupe de boutons (dériveur, catamaran, windsurf)
- Les filtres sont conservés dans les paramètres d'URL (navigation arrière et partage du lien)

_Prévisualisation_
- Cliquer sur une question ouvre un panneau de prévisualisation sur la droite (layout deux colonnes)
- Le panneau affiche : titre, énoncé (rendu markdown avec images), correction (rendu markdown avec images), source (si renseignée), difficulté, catégorie, section
- Le panneau peut être fermé avec un bouton ou en cliquant en dehors
- Sur mobile, la prévisualisation s'ouvre en plein écran (drawer ou page dédiée)

**Hors périmètre**
- Modification ou suppression de questions
- Questions en statut brouillon (non visibles)
- Recherche fulltext (voir US-14 pour la modale de sélection qui inclut déjà cette fonctionnalité)
- Export ou impression de la banque

---

### US-16 ✅ — Signalement d'un problème sur une question

**En tant que** stagiaire ou formateur,
**je veux** signaler un problème sur une question (erreur dans l'énoncé, correction incorrecte, image manquante…),
**afin de** alerter l'administrateur sans avoir à passer par un autre canal.

**Critères d'acceptation**

_Déclenchement_
- Sur chaque question affichée dans une évaluation, un lien discret "Signaler un problème" est accessible en bas de la carte (non intrusif)
- Le lien est également présent dans la prévisualisation de la banque publique (US-15)

_Formulaire de signalement_
- Cliquer ouvre une modale avec : un menu déroulant de type de problème (énoncé incorrect, correction incorrecte, doublon, mise en forme, autre), un champ description obligatoire (max 500 caractères) et un champ email de contact optionnel
- La question concernée est identifiée automatiquement (titre affiché en lecture seule dans la modale)
- La soumission est possible sans compte (anonyme)
- Protection anti-spam : champ honeypot + filtrage User-Agent

_Confirmation_
- Un message de confirmation s'affiche après envoi ("Signalement envoyé, merci")
- La modale se ferme automatiquement

_Interface admin_
- La page `/admin/reports` liste les signalements avec : titre de la question, type, email de contact, date, statut (`nouveau` / `résolu`)
- Cliquer sur une ligne ouvre un panneau latéral avec la description complète et une prévisualisation de la question concernée
- L'admin dispose d'un bouton "Marquer résolu" (ou "Rouvrir" si déjà résolu)
- Un badge indique le nombre de signalements non traités dans la navigation admin

**Hors périmètre**
- Notification par email à l'administrateur
- Authentification requise pour signaler
- Réponse à l'auteur du signalement

---

### US-17 ✅ — Ajuster le nombre de questions par section après génération

**En tant que** formateur,  
**je veux** ajouter ou retirer des questions dans une section de l'évaluation générée,  
**afin de** calibrer la durée et le périmètre de l'évaluation sans avoir à tout régénérer.

> **Interface à décider** — Voir [US-17-UI-OPTIONS.md](./US-17-UI-OPTIONS.md) pour les trois propositions (A, B, D) et leurs hybridations.

**Critères d'acceptation**

_Retrait d'une question_
- Un contrôle "Retirer" est accessible sur chaque question dans la vue principale, à côté des boutons existants "Re-tirer" et "Choisir" (US-07, US-14)
- Retirer une question la supprime de l'évaluation courante ; les questions restantes conservent leur ordre
- On peut retirer toutes les questions d'une section : la section devient alors **désactivée** (son titre n'apparaît plus dans la vue principale ni à l'impression)

_Ajout d'une question_
- Un contrôle "Ajouter" est accessible dans la vue principale (emplacement selon option UI retenue)
- L'ajout peut se faire par **tirage aléatoire** ou par **sélection manuelle** dans la banque (QuestionPickerModal), en excluant les questions déjà présentes dans l'évaluation
- Si aucune question supplémentaire n'est disponible (banque épuisée pour cette section), le contrôle est désactivé et un tooltip l'explique
- La nouvelle question s'ajoute à la fin de la section

_État et cohérence_
- Le panneau latéral (US-05) met à jour le compteur de questions du slot en temps réel ; un slot désactivé (vide) est signalé visuellement
- Les modifications ne persistent que dans la session courante (comportement identique à US-07 et US-14)
- Le re-tirage de toute la section (US-06, si implémentée) réinitialise le nombre de questions à la valeur du template, pas au nombre personnalisé

**Hors périmètre**
- Persistance du nombre de questions personnalisé entre sessions
- Ajout de questions issues d'une autre section (voir "Modification de structure" dans le backlog)
- Configuration du nombre de questions avant génération

---

### US-18 ✅ — Soumettre une question par la communauté

**En tant que** stagiaire ou formateur,
**je veux** proposer une nouvelle question à inclure dans la banque,
**afin de** contribuer à enrichir le contenu des évaluations avec des questions issues du terrain.

**Critères d'acceptation**

_Déclenchement_
- Un lien "Proposer une question" est accessible depuis la banque publique (`/questions`) et la page d'accueil
- La soumission est possible sans compte (anonyme)

_Formulaire_
- Le formulaire expose : titre court (obligatoire, max 120 caractères), énoncé en markdown (obligatoire), correction en markdown (obligatoire), catégorie + section (sélecteurs liés, obligatoires), supports applicables (checkboxes, au moins un obligatoire), email de contact (optionnel)
- L'énoncé et la correction ont chacun une preview markdown en temps réel (rendu via `createMarkdownRenderer`)
- Protection anti-spam : champ honeypot + filtrage User-Agent
- En cas d'erreur de validation, les champs sont conservés et les erreurs affichées inline

_Confirmation_
- Un message de confirmation s'affiche après envoi ("Votre proposition a été transmise, merci")
- La soumission est enregistrée en D1 dans la table `community_submissions` avec statut `en_attente`

**Hors périmètre**
- Upload d'images dans la soumission (les images peuvent être décrites textuellement dans le markdown)
- Notification par email au contributeur
- Suivi public du statut de sa soumission

---

### US-19 ✅ — Interface admin : modération des soumissions

**En tant que** administrateur,
**je veux** consulter, prévisualiser et accepter ou rejeter les questions soumises par la communauté,
**afin de** alimenter la banque de questions avec du contenu validé sans intervention SQL.

**Critères d'acceptation**

_Liste_
- La page `/admin/submissions` liste les soumissions avec filtres : statut (`en_attente`, `approuvé`, `rejeté`), catégorie, section
- Chaque ligne affiche : titre, catégorie, section, email de contact (si renseigné), date de soumission, statut
- La liste est paginée (20 par page), triée par date décroissante
- Un badge indique le nombre de soumissions `en_attente` dans la navigation admin

_Prévisualisation_
- Cliquer sur une ligne ouvre un panneau latéral avec la prévisualisation complète : titre, énoncé (rendu markdown), correction (rendu markdown), supports applicables, catégorie, section
- Le panneau réutilise le composant `QuestionPreview`

_Modération_
- Le panneau expose deux actions : **Approuver** et **Rejeter** (avec champ de note de rejet optionnel, max 300 caractères)
- Approuver crée directement une question en D1 avec statut `brouillon`, pré-remplie des champs de la soumission, et passe la soumission en `approuvé`
- Rejeter passe la soumission en `rejeté` sans créer de question
- Après action, le panneau se ferme et la liste se met à jour
- Un lien "Voir dans l'admin questions" est disponible pour les soumissions approuvées (lien vers `/admin/questions/{id}/edit`)

**Hors périmètre**
- Notification par email au contributeur lors de l'approbation ou du rejet
- Modification du contenu de la soumission avant approbation (l'admin édite ensuite via US-11)
- Import d'images depuis la soumission vers R2 (US future)
- Historique des modérations

---

### US-20 — Gestion multi-administrateurs

**En tant que** super-administrateur,  
**je veux** créer et gérer plusieurs comptes administrateurs distincts,  
**afin de** déléguer la gestion du contenu sans partager mes identifiants.

**Contexte**  
Aujourd'hui l'authentification repose sur un seul hash bcrypt stocké en secret Wrangler (`ADMIN_PASSWORD_HASH`). Cette story remplace ce mécanisme par une table `admins` en D1, avec un modèle de rôles à deux niveaux : `super_admin` et `admin`. Le premier compte créé (lors du bootstrap) est automatiquement super-admin.

**Analyse MFA à faire au plan**  
Deux pistes à évaluer lors de la conception :
- **TOTP (Google Authenticator / Authy)** : génération du secret côté serveur, QR code à scanner, vérification à chaque login. Faisable en Worker pur, pas de dépendance externe.
- **Passkeys (WebAuthn)** : délègue l'authentification au device (Face ID, Touch ID, clé hardware). Plus robuste, plus complexe à implémenter en Worker. À réserver à une US dédiée si retenu.
La décision sera prise lors du plan de la story.

**Critères d'acceptation**

_Modèle de données_
- Table `admins` : `id`, `username` (unique), `password_hash` (bcrypt), `role` (`admin` | `super_admin`), `created_at`, `updated_at`, `last_login_at`
- Le login actuel (secret `ADMIN_PASSWORD_HASH`) est retiré au profit de cette table
- Un script de bootstrap (`scripts/seed-admin.ts`) crée le premier super-admin depuis la ligne de commande (username + password en arguments, jamais committé)

_Authentification_
- Le formulaire de login (`/admin/login`) accepte username + password
- Le cookie de session identifie l'admin connecté (id + role) — signé, HttpOnly, Secure
- Un admin déconnecté ou dont la session a expiré est redirigé vers `/admin/login`
- Le guard `admin/+layout.server.ts` vérifie la session à chaque requête

_Changement de mot de passe_
- Chaque admin peut changer son propre mot de passe depuis `/admin/profile`
- L'ancien mot de passe est demandé avant validation du nouveau (confirmation requise)
- Le nouveau mot de passe est soumis à une règle minimale : ≥ 12 caractères

_Gestion des comptes (super-admin uniquement)_
- La page `/admin/admins` liste tous les comptes : username, rôle, date de création, dernière connexion
- Le super-admin peut créer un compte admin (username + mot de passe temporaire) ; l'admin nouvellement créé est invité à changer son mot de passe à la première connexion
- Le super-admin peut supprimer un compte admin (pas de suppression de compte super-admin via l'interface — protection explicite)
- Un admin ne peut pas supprimer un autre admin (ni le sien propre), quelle que soit son action dans l'UI
- Le super-admin peut reset le pwd d'un admin, dans ce cas l'utilisateur sera invité à re-modifier son pwd à la prochaine connexion

_Restrictions_
- Il doit toujours exister au moins un super-admin en base : la suppression est bloquée si c'est le dernier
- Un admin standard n'a pas accès à `/admin/admins`
- Un admin ne peut pas modifier le rôle d'un autre compte (réservé à une évolution future)

**Hors périmètre**
- MFA (TOTP ou Passkeys) — analysé au plan, implémenté dans une US dédiée (US-20b)
- Piste d'audit des actions par compte — US-20c ✅
- Réinitialisation de mot de passe par email
- SSO / OAuth
- Droits fins par section ou catégorie (tous les admins ont accès à l'ensemble du contenu)

---

### US-20a-fix ✅ — Corrections post-livraison US-20a

Corrections de bugs et UX issues découverts après la livraison de US-20a :

- **Première connexion** : le champ "mot de passe actuel" était demandé inutilement (l'admin venait de se connecter). Il est désormais masqué quand `mustChangePassword === true`, et le bouton affiche "Définir mon mot de passe". La vérification est également ignorée côté serveur dans ce cas.
- **Redirection post-changement** : après avoir défini ou changé son mot de passe, l'admin est redirigé vers `/admin` (au lieu de rester sur la page profil avec un message de succès qui ne s'affiche jamais).
- **Confirmation reset mdp** : le bouton "Réinit. mdp" ouvrait immédiatement le reset sans confirmation. Une `<dialog>` de confirmation demande désormais de taper `reset` avant d'exécuter l'action (même pattern que la suppression de question).
- **Rafraîchissement de la liste** : après la création d'un admin, `invalidateAll()` est appelé pour recharger les données sans reload manuel de la page.

---

### US-20b — Authentification à deux facteurs (MFA) pour les admins

**En tant que** super-administrateur,  
**je veux** activer une vérification en deux étapes pour les comptes administrateurs,  
**afin de** protéger l'interface admin même en cas de vol de mot de passe.

> **Dépend de** US-20 (multi-admins). À concevoir après validation de l'analyse MFA.

**Critères d'acceptation**

_Activation (par compte)_
- Depuis `/admin/profile`, un admin peut activer le TOTP : un QR code est affiché pour le scanner avec une app d'authentification (Google Authenticator, Authy, etc.)
- L'activation est confirmée en saisissant un code TOTP valide avant d'être effective
- Un ensemble de codes de secours à usage unique est généré et affiché une seule fois ; l'admin est invité à les conserver

_Connexion avec MFA active_
- Après validation username + password, une seconde étape demande le code TOTP (ou un code de secours)
- 5 tentatives incorrectes consécutives bloquent le compte pour 15 minutes

_Désactivation_
- Un admin peut désactiver le TOTP depuis `/admin/profile` (confirmation mot de passe + code TOTP actuel requis)
- Le super-admin peut réinitialiser le TOTP d'un autre compte (en cas de perte du device) sans connaître le code

_MFA obligatoire (optionnel, configuration globale)_
- Un réglage global (super-admin) peut rendre la MFA obligatoire pour tous les comptes
- Un admin sans MFA active face à cette règle est forcé de l'activer à la prochaine connexion

**Hors périmètre**
- Passkeys / WebAuthn (analysé comme alternative dans US-20, implémenté séparément si retenu)
- Notification par email lors d'une connexion depuis un nouveau device
- MFA pour les utilisateurs publics (pas de compte public dans l'application)

---

### US-20c ✅ — Piste d'audit des actions administrateurs

**En tant que** administrateur,  
**je veux** consulter un journal des actions effectuées par chaque administrateur,  
**afin de** tracer les modifications importantes et identifier d'éventuelles erreurs ou usages anormaux.

> **Dépend de** US-20 (multi-admins).

**Critères d'acceptation**

_Événements tracés_
- Création, modification et suppression de questions ✅
- Approbation et rejet de soumissions communautaires ✅
- Résolution et réouverture de signalements ✅

_Stockage_
- Table `audit_logs` : `id`, `admin_id` (nullable, SET NULL si admin supprimé), `action` (slug), `target_type` (`question` | `submission` | `report`), `target_id`, `metadata` (JSON `{ before, after }` ou contexte), `ip_address`, `created_at`
- Snapshot before/after complet pour les questions ; contexte minimal pour soumissions et signalements
- Rétention : 12 mois glissants (à implémenter via Cron Trigger)

_Interface_
- La page `/admin/audit` (accessible à tous les admins) liste les événements avec filtres : admin, type, période
- Chaque ligne affiche : date/heure, admin, action (badge coloré), cible (lien si ressource encore existante)
- Bouton « Voir » → modal JSON avec metadata before/after
- Export CSV de la période filtrée (`/admin/audit/export`)

**Hors périmètre**
- Audit des connexions (réussies et échouées) — non implémenté
- Audit des actions sur les comptes admins — non implémenté
- Alertes en temps réel sur des patterns suspects
- Intégration avec un SIEM externe
- Audit des accès en lecture (trop verbeux — uniquement les écritures)
- Purge automatique des 12 mois (Cron Trigger à faire)

---

### US-20d — Invitation par lien de 1ère connexion

**En tant que** super-administrateur,  
**je veux** que les nouveaux admins reçoivent un lien d'invitation par email pour créer leur propre mot de passe,  
**afin de** ne jamais avoir à communiquer un mot de passe temporaire manuellement.

**Critères d'acceptation**
- À la création d'un compte admin, un email contenant un lien unique (`/admin/setup?token=…`) est envoyé automatiquement
- Le token est à usage unique, valable 48 heures, stocké haché en D1 (table `admin_setup_tokens`)
- La page `/admin/setup` permet à l'admin de saisir et confirmer son mot de passe (≥ 8 caractères)
- Après validation, le token est invalidé, `mustChangePassword` passe à `false`, session créée → redirect `/admin`
- Si le token est expiré ou invalide, un message d'erreur s'affiche avec une option de renvoi (par le super-admin)
- Le super-admin peut révoquer ou renvoyer un lien depuis `/admin/admins`

**Hors périmètre**
- Envoi automatique du lien lors d'un reset de mot de passe (à évaluer séparément)
- Personnalisation du template email

**Dépend de** : mise en place de Resend (ou équivalent) comme service email du projet.

---

### US-20e — Authentification passwordless (liens magiques)

**En tant que** administrateur,  
**je veux** me connecter via un lien magique envoyé par email, sans mot de passe,  
**afin de** ne pas avoir à gérer ni mémoriser de mot de passe.

**Critères d'acceptation**
- La page `/admin/login` n'expose qu'un champ email ; après soumission, un email avec un lien de connexion unique est envoyé
- Le lien est à usage unique, valable 15 minutes, stocké haché en D1 (table `admin_magic_links`)
- Cliquer sur le lien crée la session admin et redirige vers `/admin`
- Si le lien est expiré ou déjà utilisé, un message d'erreur s'affiche
- Les mécanismes mot de passe (bcrypt, `password_hash`) sont entièrement supprimés de la table `admins` et des routes

**Hors périmètre**
- Conservation d'un accès mot de passe en fallback (refonte totale)
- MFA supplémentaire sur le lien magique

**Dépend de** : US-20d (infrastructure email déjà en place) ou mise en place directe de Resend.

---

### US-21 — Épingler une question sur un slot de template

**En tant que** administrateur,  
**je veux** associer une question fixe à un slot de template (question épinglée),  
**afin de** garantir qu'une question précise apparaît systématiquement dans toutes les évaluations générées depuis ce template.

**Critères d'acceptation**

_Association_
- Depuis l'interface d'édition d'un template, chaque slot dispose d'un champ "Question épinglée" (picker de question)
- Le picker filtre les questions publiées compatibles avec le support du template et la section du slot
- Une seule question peut être épinglée par slot (champ nullable)
- L'association est enregistrée dans `pinned_question_id` du slot
- L'admin peut retirer l'épinglage (remettre le champ à null)

_Comportement au tirage_
- La question épinglée est systématiquement incluse dans le slot correspondant lors de la génération
- Les `count - 1` questions restantes du slot sont tirées aléatoirement dans la banque (hors question épinglée)
- Si `count = 1`, la question épinglée est l'unique question du slot

_Cohérence_
- Si la question épinglée est dépubliée ou supprimée, le slot est complété par un tirage aléatoire (dégradation silencieuse) ; un avertissement est visible lors de l'édition du slot de template
- Un doublon entre slots est structurellement impossible : une question appartient à une section précise, et chaque slot correspond à une section

**Hors périmètre**
- Interface de gestion des templates (Priorité 3 du backlog)
- Épinglage multiple par slot
- Avertissement à la génération en cas de question épinglée indisponible

**Dépend de** : Interface admin de gestion des templates et slots (Priorité 3).

---

### US-22 — Définir des questions par défaut sur un slot de template

**En tant que** administrateur,  
**je veux** définir une liste de questions "par défaut" sur un slot de template,  
**afin d'** orienter le tirage vers les questions les plus pédagogiquement pertinentes tout en gardant une part d'aléatoire.

**Critères d'acceptation**

_Association_
- Depuis l'édition d'un slot de template, un champ multi-sélection "Questions par défaut" permet d'ajouter plusieurs questions
- Le picker filtre les questions publiées compatibles avec le support et la section du slot
- L'ordre de la liste n'a pas d'importance (le tirage dans la liste est aléatoire)
- Les questions sélectionnées sont enregistrées dans `preferred_question_ids` (JSON)
- L'admin peut retirer des questions de la liste ou la vider entièrement

_Comportement au tirage_
- Les `count` questions du slot sont tirées en priorité depuis la liste des questions par défaut (tirage aléatoire dans la liste)
- Si la liste contient moins de `count` questions disponibles, les slots restants sont complétés par un tirage aléatoire dans la banque globale du slot (mêmes critères de filtre)
- Si `pinned_question_id` est défini sur le slot, il prime : la question épinglée est incluse, puis `count - 1` tirages sont faits en priorité dans la liste par défaut, puis dans la banque si insuffisant

_Cohérence_
- Une question dépubliée présente dans `preferred_question_ids` est ignorée silencieusement au tirage (pas de blocage) ; un avertissement est visible à l'édition du slot

**Hors périmètre**
- Pondération ou ordre de priorité au sein de la liste par défaut
- Interface de visualisation "quelles évaluations utilisent cette question ?"

**Dépend de** : Interface admin de gestion des templates et slots (Priorité 3).

---
