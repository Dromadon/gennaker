# Authentification admin

## Modèle de session

Les sessions admin utilisent un cookie HTTP-only signé (`admin_session`). Le payload contient l'identifiant de l'admin et son rôle :

```json
{ "adminId": 1, "role": "super_admin", "iat": 1746000000000 }
```

Le cookie est signé avec HMAC-SHA256 (clé : secret Wrangler `ADMIN_SESSION_SECRET`) et expire après **7 jours**. La comparaison de signature est faite en temps constant pour éviter les timing attacks.

À chaque requête, `hooks.server.ts` :
1. Vérifie la signature HMAC et l'expiration du cookie.
2. Fait un SELECT par clé primaire sur la table `admins` pour valider que l'admin existe encore.

Ce lookup DB à chaque requête est intentionnel : il invalide **immédiatement** la session d'un admin supprimé, sans attendre l'expiration du cookie (7 jours). Pour un panneau admin à faible trafic (~80 req/jour), le coût est négligeable.

## Rôles

| Rôle | Description |
|------|-------------|
| `admin` | Accès complet au contenu (questions, signalements, soumissions) |
| `super_admin` | Idem + gestion des comptes administrateurs (`/admin/admins`) |

Il doit toujours exister au moins un `super_admin` en base. La suppression du dernier est bloquée côté serveur.

## Table `admins`

```sql
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER,
  must_change_password INTEGER NOT NULL DEFAULT 0
);
```

## Bootstrap (premier super_admin)

Sur une base vierge, créer le premier super_admin via :

```sh
npx tsx scripts/seed-admin.ts \
  --email admin@example.com \
  --first-name Alice \
  --last-name Martin \
  --password <mot_de_passe_min_8_chars> \
  [--local|--remote]
```

Le script refuse de s'exécuter si un `super_admin` existe déjà. Il ne peut pas être utilisé pour créer des admins supplémentaires — utilisez l'interface `/admin/admins` pour ça.

## Reset d'urgence

En cas de perte d'accès (mot de passe oublié, admin supprimé par erreur) :

```sh
# Vérifier les admins existants
npx wrangler d1 execute gennaker --local --command "SELECT id, email, role FROM admins;"

# Générer un hash bcrypt
node -e "require('bcryptjs').hash('nouveaumotdepasse', 10).then(h => console.log(h))"

# Réinitialiser le mot de passe d'un admin directement en SQL
npx wrangler d1 execute gennaker --local \
  --command "UPDATE admins SET password_hash='<hash>', must_change_password=1 WHERE email='admin@example.com';"
```

## Hors périmètre

- SSO / OAuth — pas prévu
- Réinitialisation par email — pas de service email côté admin
- Passkeys / WebAuthn — évalué, réservé à une US future
- TOTP (MFA) — prévu en US-20b, full Cloudflare (librairie `otpauth` via `nodejs_compat`)
- Piste d'audit — US-20c
