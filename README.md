# Pizzeria ESGI - Application de caisse Fullstack

Application de Point de Vente (POS) pour une pizzeria, combinant une interface de prise de commande, un encaissement et un panneau d'administration complet.

Le projet est une application Fullstack Spring Boot + React packagée en un seul executable (`app.jar`) pour simplifier le deploiement.

## Lancement (Windows)

L'application est livree prete a l'emploi. Seul Java est requis pour l'execution.

**Prerequis :** Java 21 ou superieur installe et accessible dans le PATH.

1. Cloner ce depot.
2. Double-cliquer sur `START_PIZZERIA.bat` a la racine.
3. Attendre le message `Started PizzeriaApplication` dans la console.
4. Ouvrir un navigateur sur `http://localhost:8080`.

## Identifiants par defaut

| Role | Prenom | Code PIN | Droits |
| :--- | :--- | :--- | :--- |
| Administrateur | Admin | `1234` | Acces complet (caisse, stocks, menu, personnel, clients) |
| Serveur | Mario | `0000` | Prise de commande et encaissement uniquement |

## Stack technique

**Backend**
- Java 21
- Spring Boot 3.2.1
- Persistance : fichiers JSON locaux (aucune base de donnees externe)
- Securite : hachage SHA-256 (classe `SecurityUtils`)

**Frontend**
- React 19
- Vite (bundler)
- Tailwind CSS
- Axios

## Architecture

Le frontend React est compile et integre dans les ressources statiques du backend Spring Boot. L'artefact unique `app.jar` sert a la fois l'API REST sous `/api/*` et l'application React sous `/`.

Toutes les regles metier (calcul des prix, remises, points de fidelite, gestion du stock) sont appliquees exclusivement cote serveur. Le frontend ne peut pas manipuler les montants.

## Recompiler le projet

Si le code source est modifie, relancer `BUILD.bat` a la racine. Le script :

1. Installe les dependances npm et compile le frontend React.
2. Telecharge Maven 3.9.9 dans `.build/` s'il est absent.
3. Compile le backend Java avec Maven (`mvn clean package`).
4. Copie le JAR produit dans `app.jar`.

Node.js doit etre installe. Maven est gere automatiquement par le script.

---

**Auteur :** Adrien Guillon