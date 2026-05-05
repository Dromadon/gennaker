# CLAUDE.md — Gennaker

Application web de génération d'évaluations théoriques pour la formation aux brevets fédéraux de voile.

**Stack** : SvelteKit · TypeScript strict · Cloudflare Workers + D1 (Drizzle ORM) + R2 · Tailwind CSS · Vitest + vitest-pool-workers

---

## 1. Lecture obligatoire au démarrage d'une nouvelle discussion

Au début de chaque nouvelle discussion, lire dans cet ordre avant d'ouvrir le moindre fichier source :

1. `ARCHITECTURE.md` — architecture, modèle de données, flux principaux
2. `STANDARDS.md` — règles de code, couches, conventions de test
3. `README.md` — commandes, setup local, structure du projet
4. Fichiers `docs/` pertinents selon le sujet abordé :
   - `docs/auth.md` → authentification
   - `docs/evaluation-flow.md` → génération ou partage d'évaluation
   - `docs/image-management.md`, `docs/image-editing.md` → images
   - `docs/submissions.md`, `docs/reports.md` → soumissions communautaires / signalements
   - `docs/admin-export.md`, `docs/dev-setup.md` → import/export / setup
   - `docs/admin-questions.md`, `docs/manual-question-pick.md` → gestion des questions

---

## 2. User stories

Avant d'écrire ou de discuter une user story, lire `USER_STORIES.md` en entier.

- Format imposé : `En tant que… / je veux… / afin de…` + critères d'acceptation + hors périmètre
- Vérifier que la story n'existe pas déjà ou n'est pas explicitement hors périmètre
- Respecter le statut existant des stories (✅ = livré, pas de régression silencieuse)

---

## 3. Architecture — rappel express

```
src/lib/domain/      Logique métier pure. Fonctions pures. Aucune dépendance externe.
src/lib/server/      Infrastructure. D1, R2, email. Dépend de Cloudflare.
src/routes/          Application. Orchestre domain + server. SvelteKit.
src/lib/components/  Présentation. Svelte, état UI.
```

**Règle d'or** : une fonction dans `domain/` doit pouvoir tourner dans un test Vitest sans aucun setup ni mock. La logique métier ne va jamais dans les routes ni dans les composants.

---

## 4. Structure systématique de tout plan

Tout plan d'implémentation doit comporter ces trois sections, dans cet ordre :

### 4.1 Stratégie de test

- **`domain/`** : priorité maximale, TDD si la logique est non triviale
- **Intégration** (`vitest-pool-workers` + D1 miniflare) : uniquement pour les flows API non triviaux
- **Objectif** : harnais large et robuste plutôt qu'un seul test d'intégration complet et fragile
- Préciser les cas limites à couvrir (banque vide, filtre incompatible, erreur D1, accès non autorisé…)
- Identifier explicitement ce qu'on ne teste pas et pourquoi

Commandes :
```bash
npm run test        # tests unitaires (src/**/*.test.ts, hors *.int.test.ts)
npm run test:watch  # mode watch
npm run test:int    # tests d'intégration (src/**/*.int.test.ts, vitest-pool-workers)
```

### 4.2 Étapes d'implémentation

Décomposer en étapes ordonnées. Pour la logique métier : écrire le test avant le code (TDD). Pour l'infrastructure : écrire le code puis les tests d'intégration.

### 4.3 Mise à jour de la documentation

Identifier explicitement quels fichiers sont impactés :

| Fichier | Mettre à jour si… |
|---------|-------------------|
| `ARCHITECTURE.md` | Nouveau flux, nouvelle table, nouveau composant structurant |
| `STANDARDS.md` | Nouvelle convention de code établie |
| `USER_STORIES.md` | Stories livrées (→ ✅) ou nouvelles stories ajoutées |
| `docs/*.md` | Comportement documenté qui change |
| `README.md` | Commandes ou setup qui changent |

---

## 5. Choix techniques — validation et pragmatisme

Avant de proposer ou d'implémenter une solution technique :

- **Valider les principes de haut niveau avec l'utilisateur** avant de descendre dans le détail (ex. : "stocke-t-on ça en D1 ou en R2 ?" avant d'écrire le schéma)
- **Challenger le besoin** si l'effort ou la complexité ne correspondent pas au gain fonctionnel : dire explicitement "est-ce que cette feature vaut la complexité qu'elle introduit ?" plutôt que de partir en implémentation
- **Favoriser le pragmatisme** : préférer la solution simple qui fonctionne sur la stack existante à une abstraction générale
- Ne pas introduire de nouvelle dépendance npm sans en discuter la justification (la stack est volontairement légère)
- Signaler les contraintes Cloudflare Workers si une option les heurte : pas de Node.js natif, timeout 30 s, mémoire ~128 MB

---

## 6. Avant chaque commit

Vérifier systématiquement les quatre points suivants :

1. **Tests** : `npm run test` passe sans erreur. Si des tests d'intégration sont concernés : `npm run test:int` aussi.
2. **Code propre** : pas de `console.log` de debug, pas de code commenté sans explication, pas de `TODO` non intentionnel, pas de `any` TypeScript.
3. **Build** : si la modification touche les routes ou le bundling, vérifier que `npm run build` passe.
4. **Documentation** : les fichiers identifiés en section 4.3 ont été mis à jour.

Ne jamais committer un état où les tests échouent, même partiellement.

---

## 7. Conventions de test

```typescript
// Nommage : describe → it, en français
describe('drawQuestions', () => {
  it('retourne le bon nombre de questions', () => { ... })
  it('exclut les questions non publiées', () => { ... })
})
```

- Fichiers unitaires : `src/**/*.test.ts` (excluent automatiquement `*.int.test.ts`)
- Fichiers d'intégration : `src/**/*.int.test.ts`
- Fixtures : dans un dossier `__fixtures__/` à côté des tests
- `Math.random()` : à spy avec `vi.spyOn` au niveau du module

---

## 8. Références rapides

| Besoin | Fichier |
|--------|---------|
| Schéma DB complet | `src/lib/server/db/schema.ts` |
| Logique de tirage | `src/lib/domain/draw.ts` |
| Types domaine | `src/lib/domain/types.ts` |
| Connexion D1 | `src/lib/server/db/index.ts` |
| Bindings Cloudflare (typage) | `src/app.d.ts` |
| Config Workers | `wrangler.toml` |
| Migrations SQL | `drizzle/migrations/` |
| Import/export ZIP | `src/lib/server/export.ts` |
