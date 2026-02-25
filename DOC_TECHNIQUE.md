# Documentation technique - Pizzeria ESGI

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet](#2-structure-du-projet)
3. [Backend - Architecture](#3-backend---architecture)
4. [Backend - API REST](#4-backend---api-rest)
5. [Regles metier](#5-regles-metier)
6. [Persistance des donnees](#6-persistance-des-donnees)
7. [Securite](#7-securite)
8. [Frontend - Architecture](#8-frontend---architecture)
9. [Frontend - Composants](#9-frontend---composants)
10. [Pipeline de build](#10-pipeline-de-build)

---

## 1. Vue d'ensemble

L'application est un systeme de caisse (POS - Point of Sale) pour une pizzeria. Elle permet :

- La prise de commande par table avec gestion d'un panier
- L'encaissement (especes, carte bancaire, sans contact)
- La gestion d'un programme de fidelite client
- L'application automatique ou manuelle de remises
- Le suivi du stock des produits
- L'administration du menu, des employes et des clients
- La supervision des ventes (chiffre d'affaires, panier moyen, repartition par mode de paiement)

Le deploiement est monolithique : le frontend React compile est embarque dans le JAR Spring Boot. Un seul processus Java sert l'integralite de l'application.

---

## 2. Structure du projet

```
Projet_Java_ESGI2/
|-- Backend/
|   |-- src/main/java/com/esgi/pizzeria/
|   |   |-- config/          Configuration CORS
|   |   |-- controller/      Controleurs REST
|   |   |-- domain/          Entites metier (POJO)
|   |   |-- repository/      Acces aux donnees JSON
|   |   |-- service/         Logique metier
|   |   |-- util/            Utilitaires (hachage)
|   |-- src/main/resources/
|   |   |-- initial-products.json    Catalogue par defaut
|   |   |-- initial-ingredients.json Ingredients par defaut
|   |   |-- static/                  Frontend compile (genere par Vite)
|-- Frontend/
|   |-- src/
|   |   |-- components/      Composants React
|   |   |-- App.jsx          Composant racine et orchestration etat global
|   |   |-- AdminPanel.jsx   Panneau d'administration
|   |   |-- config.js        URLs des endpoints API
|-- app.jar                  Executable final (backend + frontend)
|-- BUILD.bat                Script de compilation complet
|-- START_PIZZERIA.bat        Script de demarrage
|-- .gitignore
|-- README.md
|-- DOC_TECHNIQUE.md
```

---

## 3. Backend - Architecture

Le backend suit une architecture en couches classique :

```
Controller  ->  Service  ->  Repository  ->  Fichiers JSON
```

### Couche Controller

Recoit les requetes HTTP, valide les entrees de surface (presence du body, parametres obligatoires) et delegue au Service. Ne contient aucune logique metier.

### Couche Service

Concentre toute la logique metier : calculs de prix, regles de remise, gestion du stock, accumulation des points de fidelite. C'est la seule couche autorisee a prendre des decisions metier.

### Couche Repository

Responsable de la lecture et de l'ecriture dans les fichiers JSON. Chaque repository gere un fichier (`customers.json`, `orders.json`, etc.) et expose des methodes CRUD standards. Un mecanisme de seeding (`@PostConstruct`) recrée les donnees par defaut si le fichier est absent ou vide.

### Couche Domain

Classes POJO representant les entites : `Product`, `Order`, `OrderLine`, `Customer`, `Salesperson`, `Ingredient`, `ShopSettings`. Pas d'annotations JPA, pas de dependance framework — portabilite maximale.

---

## 4. Backend - API REST

Base URL : `http://localhost:8080/api`

### Produits

| Methode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/products` | Liste tous les produits du catalogue |
| GET | `/products/{id}` | Recupere un produit par son identifiant |
| POST | `/products` | Cree ou met a jour un produit |
| DELETE | `/products/{id}` | Supprime un produit |

### Commandes

| Methode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/orders` | Liste toutes les commandes |
| POST | `/orders` | Cree une commande (applique les regles metier cote serveur) |

### Clients

| Methode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/customers` | Liste tous les clients |
| GET | `/customers/{id}` | Recupere un client par son identifiant |
| GET | `/customers/search?phone=` | Recherche un client par numero de telephone |
| POST | `/customers` | Cree ou met a jour un client |
| DELETE | `/customers/{id}` | Supprime un client |
| GET | `/customers/loyalty-config` | Retourne les constantes du programme de fidelite |
| POST | `/customers/{id}/redeem` | Consomme des points de fidelite. Body : `{ "points": 100 }` |

### Personnel

| Methode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/salespersons` | Liste tous les employes |
| POST | `/salespersons/login` | Authentification par code PIN. Body : `{ "firstName": "...", "pinCode": "..." }` |
| POST | `/salespersons` | Cree un employe |
| PUT | `/salespersons/{id}` | Met a jour un employe |
| DELETE | `/salespersons/{id}` | Supprime un employe |

### Ingredients

| Methode | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/ingredients` | Liste tous les ingredients |
| POST | `/ingredients` | Cree ou met a jour un ingredient |
| DELETE | `/ingredients/{id}` | Supprime un ingredient |

---

## 5. Regles metier

Toutes les regles sont implementees dans `OrderService` et `CustomerService`. Aucune constante metier n'est dupliquee dans le frontend — celui-ci les recupere via l'endpoint `/api/customers/loyalty-config`.

### Validation d'une commande (`OrderService.createOrder`)

L'execution suit cet ordre strict :

1. **Validation structurelle** : le panier ne peut pas etre vide.
2. **Horodatage serveur** : la date est generee par le serveur (`LocalDateTime.now()`), le client ne peut pas la falsifier.
3. **Recalcul du sous-total** : chaque prix est relu depuis le catalogue serveur. Le prix envoye par le client est ignore, ce qui empeche toute manipulation de tarif.
4. **Verification du stock** : pour chaque article dont le stock est suivi (`stock > 0`), la disponibilite est verifiee avant toute persistance. Si un article manque, une exception `IllegalStateException` est levee et la commande est annulee.
5. **Remise automatique** : si le sous-total depasse 20 EUR et qu'aucune remise manuelle n'a ete appliquee, une remise de 5 % est calculee et ajoutee automatiquement.
6. **Application de la remise** : la remise (manuelle ou automatique) est plafonnee au sous-total, puis deduite pour obtenir le total final.
7. **Persistance** : la commande finalisee est ecrite sur disque.
8. **Credit de fidelite** : si un client est associe a la commande, des points sont credites sur la base du total final apres remise.

### Programme de fidelite (`CustomerService`)

Les constantes sont definies comme champs `public static final` dans `CustomerService`, ce qui constitue la source de verite unique pour toute l'application :

| Constante | Valeur | Description |
| :--- | :--- | :--- |
| `POINTS_PER_EURO` | 1 | Points gagnes par euro depense |
| `POINTS_PER_REDEMPTION` | 100 | Seuil minimum pour utiliser des points |
| `DISCOUNT_PER_REDEMPTION` | 5,00 EUR | Remise obtenue par tranche de 100 points |
| `AUTO_DISCOUNT_RATE` | 5,0 % | Taux de la remise automatique |
| `AUTO_DISCOUNT_THRESHOLD` | 20,00 EUR | Sous-total a partir duquel la remise auto s'applique |

Points gagnes : `Math.floor(totalFinal) * POINTS_PER_EURO`

Utilisation : les points se consomment par tranches de 100. La consommation est appliquee avant la validation de la commande (endpoint `/redeem` appele en premier par le frontend).

### Gestion du stock

Trois etats possibles pour le champ `stock` d'un `Product` :

- `null` : stock non initialise, traite comme illimite.
- `0` : illimite explicitement.
- `> 0` : stock suivi. Decremente a chaque commande validee.

Si le stock est insuffisant, la commande est rejetee avec HTTP 409 Conflict.

---

## 6. Persistance des donnees

Les donnees sont stockees dans le repertoire `Backend/data/` (cree automatiquement au premier demarrage). Ce repertoire est exclu du versionnement git.

| Fichier | Contenu |
| :--- | :--- |
| `data/products.json` | Catalogue des produits (plats et boissons) |
| `data/orders.json` | Historique des commandes |
| `data/customers.json` | Base clients avec points de fidelite |
| `data/salespersons.json` | Employes et codes PIN haches |
| `data/ingredients.json` | Stock des ingredients |
| `data/settings.json` | Parametres generaux de la boutique |

### Mecanisme de seeding

A chaque demarrage, chaque repository verifie l'existence et le contenu de son fichier JSON. Si le fichier est absent ou vide, il est initialise depuis les fichiers de reference situes dans `src/main/resources/` (`initial-products.json`, `initial-ingredients.json`). Pour les autres entites (clients, employes, commandes), un jeu de donnees minimal est cree en dur dans le code.

### Migration de schema

Lorsqu'un nouveau champ est ajoute a une entite (exemple : ajout du champ `category` sur `Product`), le repository peut executer une migration dans son `@PostConstruct` apres le chargement des donnees. Cela permet de faire evoluer le schema sans perdre les donnees existantes.

---

## 7. Securite

### Authentification

L'authentification s'effectue par code PIN. Le PIN n'est jamais stocke en clair : lors de la creation d'un employe, il est hache en SHA-256 par `SecurityUtils.hashPassword()`. A la connexion, le PIN saisi est hache et compare a la valeur stockee.

Note : pour un systeme en production, BCrypt serait preferable car il integre un sel aleatoire et un facteur de cout reglable.

### Integrite des prix

Le montant total d'une commande est toujours recalcule cote serveur a partir du catalogue officiel. Toute valeur de prix envoyee par le client est ignoree.

### CORS

La configuration CORS (`CorsConfig`) autorise uniquement l'origine `http://localhost:5173` (serveur de developpement Vite). En mode production, le frontend etant embarque dans le JAR, cette configuration n'est plus sollicitee.

### Donnees sensibles

Les codes PIN haches et les donnees clients ne transitent pas dans les logs applicatifs. Le frontend ne recoit jamais les hash SHA-256 — l'endpoint `/login` retourne les informations de profil sans le champ `pinCode`.

---

## 8. Frontend - Architecture

Le frontend est une Single Page Application (SPA) React 19 construite avec Vite.

### Gestion de l'etat

L'etat global est gere dans `App.jsx` par des hooks React (`useState`). Il n'y a pas de store externe (Redux, Zustand). Les donnees descendent via les props ; les actions remontent via des callbacks.

Etats principaux dans `App.jsx` :

| Etat | Type | Description |
| :--- | :--- | :--- |
| `view` | string | Ecran actif : `LOGIN`, `DASHBOARD`, `POS`, `ADMIN` |
| `currentUser` | object | Employe authentifie |
| `currentTransaction` | object | Commande en cours (panier, table, client, remise) |
| `products` | array | Catalogue charge au demarrage |

### Flux de navigation

```
LoginScreen
    -> DashboardScreen (choix de table)
        -> PosScreen (prise de commande)
            -> CustomerSearchModal (selection client + remise)
                -> PaymentModal (choix du mode de paiement)
                    -> ReceiptModal (recu)
        -> AdminPanel (administration)
```

### Communication avec le backend

Toutes les requetes HTTP passent par Axios. Les URLs sont centralisees dans `config.js` (`ENDPOINTS`). Aucune URL n'est ecrite directement dans les composants.

---

## 9. Frontend - Composants

| Fichier | Role |
| :--- | :--- |
| `App.jsx` | Orchestrateur principal. Gere la navigation, le panier, l'appel a l'API commandes et le recalcul du solde de points apres validation. |
| `LoginScreen.jsx` | Ecran de connexion par PIN. Appelle `POST /api/salespersons/login`. |
| `DashboardScreen.jsx` | Grille de selection des tables. Bouton d'acces a l'administration. |
| `PosScreen.jsx` | Interface de caisse. Onglets par categorie de produit (`category`), panier, bouton Encaisser. |
| `CustomerSearchModal.jsx` | Modal d'association client et de gestion des remises. Affiche l'annuaire complet des clients trie par ordre alphabetique avec recherche filtrante (nom, telephone). Integre la section fidelite (slider de points) et la remise manuelle (pourcentage ou montant fixe). |
| `PaymentModal.jsx` | Choix du mode de paiement (especes, CB, sans contact). |
| `ReceiptModal.jsx` | Affichage du recu. Affiche le detail de la commande, la remise appliquee et les points de fidelite gagnes. |
| `AdminPanel.jsx` | Panneau d'administration. Contient les onglets Supervision, Stocks, Carte, Equipe, Clients. |
| `DashboardScreen.jsx` (admin) | Statistiques : CA, panier moyen, nombre de commandes, repartition par mode de paiement, historique filtre (jour / 7 jours / mois). |
| `StockPanel.jsx` | Gestion du stock des produits. |
| `MenuPanel.jsx` | Gestion de la carte (ajout, modification, suppression de produits). |
| `UsersPanel.jsx` | Gestion du personnel et des permissions. |
| `CustomersPanel.jsx` | Vue administrative de la base clients. |

---

## 10. Pipeline de build

### Prerequis

| Outil | Version minimale | Usage |
| :--- | :--- | :--- |
| Java | 21 | Execution et compilation du backend |
| Node.js | 18 | Compilation du frontend React |
| Maven | 3.9 | Compilation Java (telecharge automatiquement par `BUILD.bat`) |

### BUILD.bat - etapes detaillees

1. Verification de Java et Node.js dans le PATH.
2. Arret du processus ecoutant sur le port 8080 si present (pour liberer `app.jar`).
3. `npm install --no-audit --no-fund` dans `Frontend/`.
4. `npm run build` via Vite. Les fichiers sont produits directement dans `Backend/src/main/resources/static/` (configre dans `vite.config.js`, `outDir`).
5. Telechargement de Maven 3.9.9 dans `.build/` si absent.
6. `mvn clean package -DskipTests` dans `Backend/`. Le plugin `spring-boot-maven-plugin` repackage le JAR pour inclure les fichiers statiques.
7. Copie du JAR produit (`Backend/target/pizzeria-backend-0.0.1-SNAPSHOT.jar`) vers `app.jar` a la racine.

### Demarrage (START_PIZZERIA.bat)

Lance `java -jar app.jar` et ouvre `http://localhost:8080` dans le navigateur par defaut.

Le serveur ecoute sur le port 8080 (configurable dans `Backend/src/main/resources/application.properties`).

---

**Auteur :** Adrien Guillon
