# FairMatch - Application de Matching Recrutement

Une application web moderne et interactive de type Tinder pour le recrutement, permettant aux recruteurs de découvrir des candidats et aux chercheurs d'emploi de trouver des offres qui leur correspondent.

## 🎨 Fonctionnalités

- **Authentification** : Inscription et connexion par email/mot de passe
- **Sélection de rôle** : Choix entre Recruteur ou Rechercheur d'emploi
- **Interface Swipe** : 
  - Swipe à droite = J'aime
  - Swipe à gauche = Passer
  - Animations fluides et interactives
- **Listes personnalisées** :
  - Recruteurs : "Mes candidats retenus"
  - Rechercheurs : "Mes offres retenues"
- **Design moderne** : Interface colorée, animée et mobile-first

## 🚀 Technologies

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **TailwindCSS** : Styling moderne et responsive
- **Framer Motion** : Animations fluides et interactives
- **Lucide React** : Icônes modernes
- **localStorage** : Stockage local des données

## 📦 Installation

1. **Installer les dépendances** :
```bash
npm install
```

2. **Lancer le serveur de développement** :
```bash
npm run dev
```

3. **Ouvrir dans le navigateur** :
```
http://localhost:3000
```

## 🎯 Utilisation

### Pour les Recruteurs

1. Créez un compte ou connectez-vous
2. Sélectionnez le rôle "Recruteur"
3. Swipez sur les candidats :
   - **Swipe à droite** : Candidat apprécié → Ajouté à "Mes candidats retenus"
   - **Swipe à gauche** : Candidat rejeté
4. Consultez vos candidats retenus dans la page dédiée

### Pour les Rechercheurs d'emploi

1. Créez un compte ou connectez-vous
2. Sélectionnez le rôle "Rechercheur d'emploi"
3. Swipez sur les offres d'emploi :
   - **Swipe à droite** : Offre intéressante → Ajoutée à "Mes offres retenues"
   - **Swipe à gauche** : Offre rejetée
4. Consultez vos offres retenues dans la page dédiée

## 📁 Structure du Projet

```
├── app/
│   ├── login/          # Page de connexion
│   ├── register/       # Page d'inscription
│   ├── select-role/    # Sélection du rôle
│   ├── swipe/          # Interface principale de swipe
│   ├── my-candidates/  # Liste des candidats retenus (recruteurs)
│   ├── my-jobs/        # Liste des offres retenues (rechercheurs)
│   ├── layout.tsx      # Layout principal
│   └── globals.css     # Styles globaux
├── components/
│   └── SwipeCard.tsx   # Composant de carte swipeable
├── lib/
│   ├── auth.tsx        # Gestion de l'authentification
│   ├── data.ts         # Données mock (candidats et offres)
│   └── swipes.ts       # Gestion des swipes
└── package.json
```

## 🎨 Design

- **Couleurs** : Palette purple/pink pour un design moderne et engageant
- **Animations** : Transitions fluides avec Framer Motion
- **Responsive** : Design mobile-first, adapté à tous les écrans
- **Micro-interactions** : Effets visuels lors des swipes et interactions

## 💾 Stockage des Données

Les données sont stockées localement dans le navigateur via `localStorage` :
- **users** : Liste des utilisateurs enregistrés
- **user** : Utilisateur actuellement connecté
- **swipes** : Historique de tous les swipes effectués

## 🔧 Scripts Disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Compile l'application pour la production
- `npm run start` : Lance le serveur de production
- `npm run lint` : Vérifie le code avec ESLint

## 📝 Notes

- Les données sont stockées localement (localStorage), elles seront perdues si vous videz le cache du navigateur
- Les photos de profil utilisent des avatars générés aléatoirement (pravatar.cc)
- L'application est entièrement fonctionnelle en mode développement

## 🎉 Améliorations Futures Possibles

- Backend avec base de données réelle
- Système de matching bidirectionnel
- Chat entre recruteurs et candidats
- Notifications en temps réel
- Filtres avancés de recherche
- Profils détaillés avec CV/portfolio

---

Développé avec ❤️ pour une expérience de recrutement moderne et fun !
