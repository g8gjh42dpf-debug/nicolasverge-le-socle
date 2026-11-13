# Le Socle — Drill's & Skills

L'outil de pilotage des salles accompagnées par Drill's & Skills : planning et remplissage, séances d'essai et transformation, événements avec rétro-planning, équipe (observations, invitations) et ressources. Deux accès : **owner** (tout) et **coach** (ses missions, ses essais, les tâches d'événements, les ressources ; aucun chiffre).

Application web installable sur téléphone (PWA), construite avec Vite + React, données dans Supabase (projet `le-socle`, région Paris).

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner l'URL et la clé publique Supabase
npm run dev
```

## Mettre en ligne (Vercel, gratuit pour commencer)

1. Sur vercel.com, « Add New… → Project », importer ce dépôt GitHub.
2. Framework : Vite (détecté automatiquement).
3. Variables d'environnement : `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (valeurs de `.env.example`).
4. Deploy. Chaque push sur `main` redéploie l'app.

## Réglages Supabase avant d'ouvrir aux salles

- **Authentication → URL Configuration** : mettre l'adresse Vercel (ex. `https://le-socle.vercel.app`) dans *Site URL* et dans *Redirect URLs*. Sans ça, les liens d'e-mail (confirmation, mot de passe oublié) pointent vers localhost.
- **Authentication → Emails → SMTP** : brancher un vrai expéditeur (Resend, Brevo…). L'envoi par défaut de Supabase est limité à quelques e-mails par heure.
- **Authentication → Providers → Email** : laisser « Confirm email » activé.

## Premier owner

L'owner crée son compte, puis « Créer une salle ». Il ajoute ses coachs dans **Équipe**, puis invite chacun par e-mail : le lien est copié, il l'envoie par message ; le coach crée son compte avec cette adresse et arrive dans la salle.

Pour te donner l'accès à toutes les salles (admin plateforme), ajoute ton identifiant utilisateur dans la table `platform_admins`.

## Base de données

Le schéma, les fonctions et les règles d'accès (RLS) sont dans `supabase/migrations/`. Les règles sont appliquées par la base elle-même : un coach ne peut pas lire les finances, la fréquentation, les observations ni les essais des autres, même en contournant l'interface.

## Feuille de route

- Version pilote : Aujourd'hui, Planning, Séances d'essai, Événements, Équipe, Ressources.
- Ensuite : suivi des nouveaux adhérents (60 jours), simulateur LTV, réunion d'équipe, document d'onboarding coach en PDF, rappels par e-mail, abonnement Stripe.
