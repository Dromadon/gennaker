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

### US-09 — Exporter le contenu en ZIP (backup on-demand)

**En tant que** administrateur,  
**je veux** télécharger un export complet du contenu (questions et images) en un clic,  
**afin de** pouvoir reconstruire la base de données et les médias depuis zéro en cas de sinistre.

**Critères d'acceptation**
- Un endpoint admin `GET /admin/export` génère et retourne un fichier ZIP
- Le ZIP contient toutes les questions au format markdown, organisées en `{catégorie}/{section}/{titre}.md`, avec l'énoncé et la correction séparés par `# Correction`
- Le ZIP contient toutes les images depuis R2, dans leur arborescence d'origine (`images/{catégorie}/{section}/images/{fichier}`)
- Le ZIP contient un fichier `templates.json` décrivant les templates et leurs slots
- Le fichier est nommé `gennaker-backup-{YYYY-MM-DD}.zip`
- L'endpoint est protégé par l'authentification admin existante
- La génération ne dépasse pas les limites CPU/mémoire d'un Worker (streaming si nécessaire)

**Hors périmètre**
- Planification automatique depuis l'interface
- Backup incrémental

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
| 2 | Interface admin : CRUD questions (titre, énoncé, correction, supports, difficulté) |
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
