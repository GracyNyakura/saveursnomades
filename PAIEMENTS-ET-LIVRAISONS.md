# Paiements et livraisons

## Fonctionnement

- Réservation : le client choisit des articles, renseigne ses coordonnées, sa date et son heure, puis règle le panier en USD via PayPal.
- Livraison : le client choisit ses articles, une des 24 communes de Kinshasa, son adresse complète, une date et une heure. Le forfait de livraison est fixe à 15 USD pour toutes les communes.
- Le serveur relit les prix du catalogue, crée le paiement PayPal, puis ne marque la commande payée qu’après confirmation de la capture PayPal.
- Les commandes sont conservées dans Supabase. Les variables secrètes sont uniquement utilisées par le serveur Vercel.

## Supabase

1. Créer un projet Supabase.
2. Ouvrir **SQL Editor** et exécuter le contenu de `db/supabase-online-orders.sql`.
3. Dans **Project Settings > API**, relever l’URL du projet et la clé `service_role`. Ne jamais utiliser cette clé dans le navigateur ou la partager dans un message.

## PayPal Sandbox

1. Vérifier que PayPal permet au compte marchand basé en République démocratique du Congo de recevoir des paiements commerciaux et d’utiliser Checkout. La page PayPal RDC destinée aux consommateurs ne suffit pas à confirmer l’accès marchand/API.
2. Créer ou utiliser un compte PayPal Business, puis ouvrir le tableau de bord développeur PayPal.
3. Dans **Apps & Credentials > Sandbox**, créer une application REST et relever son Client ID et son Secret. Les identifiants sandbox servent uniquement aux paiements d’essai.
4. Ajouter ces variables aux variables d’environnement du projet Vercel (environnements Preview et Production selon le besoin) :

```text
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=<Client ID sandbox>
PAYPAL_CLIENT_SECRET=<Secret sandbox>
SUPABASE_URL=<URL du projet Supabase>
SUPABASE_SERVICE_ROLE_KEY=<clé service_role Supabase>
APP_URL=https://saveursnomades.vercel.app
```

5. Pour recevoir un email à chaque commande, configurer également `ORDERS_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` et `EMAIL_FROM`.
6. Redéployer. Tester avec un compte acheteur sandbox et vérifier dans PayPal Sandbox et la table `online_orders` que le paiement, les prix et le forfait de livraison sont corrects.

## Passage en production

Après validation du compte marchand, de la réception des fonds et des paiements sandbox : créer/utiliser une application REST **Live**, remplacer les identifiants sandbox par les identifiants Live, puis définir `PAYPAL_MODE=live` dans Vercel et redéployer. Ne jamais mettre un secret PayPal ou une clé `service_role` dans un fichier public, dans le code frontend ou dans le chat.
