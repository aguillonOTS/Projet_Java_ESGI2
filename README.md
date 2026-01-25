# Pizzeria ESGI - Application de Caisse Fullstack

Application de gestion de Point de Vente (POS) pour une pizzeria, combinant une interface de prise de commande et un panneau d'administration.

Ce projet est une application Fullstack (Spring Boot + React) packagée sous forme d'un exécutable unique pour simplifier le déploiement.

## Instructions de lancement (Windows)

L'application est livrée prête à l'emploi. Aucun environnement de développement (Node.js, Maven) n'est nécessaire pour l'exécution.

**Prérequis :** Java 21 (ou version ultérieure) doit être installé.

1.  Cloner ce dépôt.
2.  Double-cliquer sur le fichier `START_PIZZERIA.bat` situé à la racine du projet.
3.  Une fenêtre de commande va s'ouvrir pour démarrer le serveur.
4.  Le navigateur s'ouvrira automatiquement sur `http://localhost:8080`.

Note : Si le navigateur ne s'ouvre pas automatiquement, attendez le message "Started PizzeriaApplication" dans la console, puis accédez manuellement à l'adresse locale.

## Identifiants de connexion

Deux profils sont pré-configurés pour tester les différentes fonctionnalités :

| Rôle | Utilisateur | Code PIN | Accès |
| :--- | :--- | :--- | :--- |
| **Administrateur** | Admin | `1234` | Accès complet (Stocks, Menu, Personnel, Caisse) |
| **Serveur** | Mario | `0000` | Prise de commande et Encaissement uniquement |

## Stack Technique

**Backend :**
* Java 21
* Spring Boot 3.2
* Stockage : Fichiers JSON (Pas de base de données externe à installer)
* Sécurité : Hachage SHA-256 natif

**Frontend :**
* React 18
* Vite
* Tailwind CSS
* Axios

## Choix d'Architecture

### 1. Déploiement Monolithique
Le frontend React est compilé et intégré directement dans les ressources statiques du backend Spring Boot. Cela permet de livrer un artefact unique (`app.jar`) qui gère à la fois l'API REST et le rendu des pages web.

### 2. Sécurité des données
* **Authentification :** Les mots de passe ne sont jamais stockés en clair. Le backend compare les empreintes SHA-256 lors de la connexion.
* **Intégrité des commandes :** Le calcul du prix total est effectué exclusivement côté serveur (Backend) pour empêcher toute manipulation des montants via le navigateur.

### 3. Persistance légère
Pour répondre à la contrainte de portabilité, les données (utilisateurs, produits, commandes) sont stockées dans des fichiers JSON locaux. Le système inclut un mécanisme de "Seeding" qui recrée les données par défaut si les fichiers sont absents.

## Recompiler le projet (Optionnel)

Si vous souhaitez modifier le code source et régénérer l'exécutable `app.jar` :

1.  Assurez-vous d'avoir **Node.js** et **Maven** installés.
2.  Exécutez le script `build_app.bat` à la racine.
3.  Le script va :
    * Installer les dépendances Frontend et construire le bundle.
    * Copier le bundle dans le Backend.
    * Compiler le Backend avec Maven.
    * Générer le nouveau `.jar` dans le dossier `Backend/target`.

---

**Auteur :** Adrien Guillon