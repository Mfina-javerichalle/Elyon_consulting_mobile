# ELYON Consulting — Application Mobile Android

> Application Android de suivi de dossiers de mobilité internationale  
> Développée dans le cadre du BTS SIO option SLAM — Session 2026  
> **MFINA Javerichalle Maconslavie** — CFA SCHOLIA, Thiais

---

## Présentation du projet

ELYON Consulting Mobile est une application Android développée avec **React Native (Expo)** permettant aux clients de gérer leurs dossiers de mobilité internationale (visa étudiant, touristique, professionnel) depuis leur smartphone.

Elle consomme l'**API REST Laravel** de l'application web ELYON Consulting, sécurisée par **JWT via Laravel Sanctum**, garantissant une cohérence totale des données entre le web et le mobile.

---

## Liens

| Ressource | Lien |
|---|---|
| GitHub Mobile | https://github.com/Mfina-javerichalle/Elyon_consulting_mobile |
| GitHub Web (API) | https://github.com/Mfina-javerichalle/Eyon_consulting_web |
| Site en production | https://elyon-consulting.com |
| Documentation (Drive) | https://drive.google.com/drive/folders/1mnPxuYiy0xx9JAFyeN8Uq5jQe4GHWYnS |

---

## Architecture technique

```
Application Mobile (React Native / Expo)
         │
         │  HTTPS + Authorization: Bearer {token}
         ▼
  API REST Laravel  ←→  MySQL 8
  (elyon-consulting.com/api)
```

L'application mobile ne communique jamais directement avec la base de données. Elle passe systématiquement par l'API REST Laravel, qui gère l'authentification, la validation des données et la logique métier.

---

## Stack technologique

| Couche | Technologie | Rôle |
|---|---|---|
| Framework mobile | React Native (Expo SDK 54) | Application Android native |
| Langage | JavaScript ES6+ / JSX | Composants React Native |
| Navigation | React Navigation v6 | Tab Navigator + Stack Navigator |
| Appels API | Axios + intercepteurs | Requêtes HTTPS + Bearer Token automatique |
| Persistance locale | AsyncStorage | Stockage JWT entre les sessions |
| Upload fichiers | expo-document-picker | Sélection et envoi de documents |
| Photos | expo-image-picker | Modification de l'avatar |
| Backend consommé | Laravel 11 + Sanctum | API REST + authentification JWT |
| Base de données | MySQL 8 | Données hébergées sur o2switch |
| Tests | Expo Go + Android Studio | Smartphone physique + émulateur |
| Versionnement | Git / GitHub | Dépôt séparé du projet web |

---

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

- **Node.js** 18 ou supérieur
- **Expo CLI** : `npm install -g expo-cli`
- **Android Studio** avec un émulateur configuré (Pixel 6, API 33+) **ou** l'application **Expo Go** sur un téléphone Android physique

---

## Installation et lancement

```bash
# 1. Cloner le dépôt
git clone https://github.com/Mfina-javerichalle/Elyon_consulting_mobile.git
cd Elyon_consulting_mobile

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npx expo start
```

### Tester l'application

**Sur téléphone physique (Expo Go) :**
1. Installer Expo Go depuis le Google Play Store
2. Scanner le QR Code affiché dans le terminal

**Sur émulateur Android Studio :**
1. Ouvrir Android Studio et démarrer un Virtual Device
2. Dans le terminal Expo, appuyer sur `a`

> **Important :** L'API REST doit être accessible. En développement, l'URL de base est configurée dans `src/utils/constants.js` → `API_URL = 'https://elyon-consulting.com/api'`

---

## Structure du projet

```
elyon-consulting-mobile/
├── App.js                              # Point d'entrée — AuthProvider + AppNavigator
├── app.json                            # Configuration Expo
├── package.json                        # Dépendances npm
│
└── src/
    ├── utils/
    │   └── constants.js                # URL API, couleurs, labels statuts
    │
    ├── services/
    │   ├── api.js                      # Instance Axios + intercepteurs + toutes les fonctions API
    │   └── AuthContext.js              # Contexte React — état de connexion global
    │
    ├── navigation/
    │   └── AppNavigator.js             # Auth Stack + Tab Navigator + Stack Navigators
    │
    └── screens/
        ├── Auth/
        │   ├── LoginScreen.js          # Connexion
        │   ├── RegisterScreen.js       # Inscription
        │   └── ForgotPasswordScreen.js # Mot de passe oublié
        │
        ├── Tabs/
        │   ├── ServicesScreen.js       # Liste des services de visa
        │   ├── DossiersScreen.js       # Liste + création de dossiers
        │   ├── MessagerieScreen.js     # Liste des conversations
        │   └── ProfilScreen.js         # Profil + paramètres du compte
        │
        └── Dossiers/
            ├── ServiceDetailScreen.js  # Détail d'un service
            ├── DossierDetailScreen.js  # Documents + étapes + upload
            └── MessageDetailScreen.js  # Conversation par dossier
```

---

## Fonctionnalités

### Authentification & Compte
- Connexion avec persistance du JWT via AsyncStorage
- Vérification du token à chaque démarrage de l'application
- Inscription avec validation des données
- Mot de passe oublié (email de réinitialisation via Gmail SMTP)
- Modification du profil (nom, email, téléphone)
- Changement de mot de passe
- Modification de la photo de profil (galerie photos)
- Suppression définitive du compte
- Déconnexion (révocation du token côté serveur)

### Services
- Affichage de tous les services de visa disponibles
- Bannière d'accueil avec statistiques (500+ clients, 98% de succès)
- Détail complet d'un service : informations visa, documents requis, étapes

### Dossiers
- Liste de tous les dossiers du client avec statut coloré
- Création d'un dossier en choisissant un service
- Détail complet : statut global, documents requis, progression des étapes
- Upload de pièces justificatives (PDF, JPEG, PNG — max 5 Mo)
- Renvoi d'un document refusé
- Affichage du commentaire de refus de l'administrateur

### Messagerie
- Fil de conversation par dossier
- Messages du client à droite (bleu), messages admin à gauche (blanc)
- Envoi de messages en temps réel
- Rechargement automatique toutes les 30 secondes

---

## Endpoints API consommés

| Méthode | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Connexion — retourne Bearer Token | Non |
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/forgot-password` | Envoi email réinitialisation | Non |
| POST | `/api/auth/logout` | Déconnexion — révoque le token | Oui |
| GET | `/api/auth/profil` | Profil de l'utilisateur connecté | Oui |
| PUT | `/api/auth/profile` | Modifier profil | Oui |
| POST | `/api/auth/avatar` | Modifier l'avatar | Oui |
| DELETE | `/api/auth/account` | Supprimer le compte | Oui |
| GET | `/api/services` | Liste des services | Non |
| GET | `/api/services/{id}` | Détail d'un service | Non |
| GET | `/api/dossiers` | Mes dossiers | Oui |
| POST | `/api/dossiers` | Créer un dossier | Oui |
| GET | `/api/dossiers/{id}` | Détail d'un dossier | Oui |
| POST | `/api/dossiers/{id}/documents` | Uploader un document | Oui |
| GET | `/api/dossiers/{id}/messages` | Historique messagerie | Oui |
| POST | `/api/dossiers/{id}/messages` | Envoyer un message | Oui |

---

## Sécurité

| Mesure | Implémentation |
|---|---|
| Authentification | Bearer Token JWT via Laravel Sanctum |
| Persistance token | AsyncStorage avec vérification au démarrage |
| Token expiré | Nettoyage automatique AsyncStorage + redirection Login (erreur 401) |
| Isolation des données | Le serveur vérifie que chaque dossier appartient au client connecté |
| Upload fichiers | Validation format (PDF, JPEG, PNG) et taille (≤ 5 Mo) côté serveur |
| Transport | HTTPS sur toutes les communications (certificat Let's Encrypt) |

---

## Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Expiration silencieuse du token JWT | Ajout de la vérification au démarrage dans `AuthContext.js` — redirection automatique vers Login si le token est absent ou expiré |
| Envoi de fichiers incompatible avec l'API | Utilisation de `multipart/form-data` via Axios avec objet `{ uri, name, type }` pour `expo-document-picker` |
| Relation `sender` inexistante dans le modèle `Message` | Correction du `MessageController` pour utiliser la relation `expediteur` définie dans le modèle Laravel |
| Documents requis non affichés si aucun fichier uploadé | Refactorisation de `DossierController::show()` pour retourner tous les documents requis du service, avec leur statut d'upload |

---

## Compétences développées

**Techniques :**
- React Native (Expo SDK) — développement Android natif
- Consommation d'API REST avec Axios et intercepteurs automatiques
- Authentification JWT via AsyncStorage
- Upload de fichiers avec `expo-document-picker` et `expo-image-picker`
- React Navigation v6 (Tab Navigator + Stack Navigator)
- Gestion d'état global avec React Context
- Adaptation aux contraintes mobiles Android

**Organisationnelles :**
- Gestion de projet mobile itératif
- Tests avec Expo Go et Android Studio
- Tests API avec Postman
- Versionnement Git / GitHub
- Documentation technique

---

## Informations BTS

| Champ | Valeur |
|---|---|
| Candidat | MFINA Javerichalle Maconslavie |
| N° candidat | 02545873286 |
| Formation | BTS SIO — Option SLAM |
| Établissement | CFA SCHOLIA, Thiais |
| Réalisation n° | 2 |
| Période | Février 2026 – Mai 2026 |
| Épreuve | E6 — Conception et développement d'applications |

---

© 2026 Elyon Consulting — Tous droits réservés
