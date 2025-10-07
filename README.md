# 🏛️ Musée des Civilisations Noires - API Backend

API REST pour l'application Musée des Civilisations Noires développée avec Express.js et MongoDB.

## 🚀 Déploiement Rapide

### Railway (Recommandé)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/votre-username/musee-backend-api)

## 📋 Variables d'Environnement

Configurez ces variables dans votre plateforme de déploiement :

```env
MONGO_URI=mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn
JWT_SECRET=musee_des_civilisations_noires_secret_key_2024
JWT_EXPIRE=7d
ADMIN_EMAIL=mcn@mcn.sn
ADMIN_PASSWORD=museedescivilisationsnoire
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.vercel.app
```

## 🔧 Développement Local

```bash
# Cloner le repository
git clone https://github.com/votre-username/musee-backend-api.git
cd musee-backend-api

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

## 📡 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/admin/login` - Connexion administrateur
- `GET /api/auth/me` - Informations utilisateur

### Œuvres d'Art
- `GET /api/artworks` - Liste des œuvres
- `GET /api/artworks/:id` - Détails d'une œuvre
- `GET /api/artworks/qr/:qrCode` - Œuvre par QR code
- `POST /api/artworks` - Créer une œuvre (Admin)

### Billets
- `GET /api/tickets` - Liste des billets
- `GET /api/tickets/:id` - Détails d'un billet
- `POST /api/tickets` - Créer un billet (Admin)

### Achats
- `POST /api/purchases` - Créer un achat
- `GET /api/purchases` - Historique des achats
- `POST /api/purchases/validate` - Valider un billet

## 🔐 Comptes par Défaut

- **Admin** : `mcn@mcn.sn` / `museedescivilisationsnoire`
- **User** : `user@example.com` / `user123`

## 📊 Health Check

- **URL** : `GET /api/health`
- **Réponse** : Statut de l'API et informations système

## 🛠️ Technologies

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification
- **QRCode** - Génération de codes QR

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

---

**Développé pour le Musée des Civilisations Noires** 🏛️
