# 🚀 Déploiement Rapide - Backend API

## 📋 Étapes Rapides

### 1. Créer le Repository GitHub

1. **Allez sur GitHub** : https://github.com/new
2. **Nom du repository** : `musee-backend-api`
3. **Description** : "API Backend pour Musée des Civilisations Noires"
4. **Visibilité** : Public
5. **Créer le repository**

### 2. Connecter le Repository Local

```bash
# Ajouter le remote origin
git remote add origin https://github.com/VOTRE_USERNAME/musee-backend-api.git

# Pousser le code
git branch -M main
git push -u origin main
```

### 3. Déployer sur Railway (Recommandé)

#### Option A: Déploiement Automatique
1. **Allez sur Railway** : https://railway.app
2. **Connectez votre compte GitHub**
3. **Sélectionnez le repository** `musee-backend-api`
4. **Railway détecte automatiquement** que c'est un projet Node.js
5. **Configurez les variables d'environnement** (voir ci-dessous)
6. **Déployez !**

#### Option B: Déploiement via CLI
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Lier au projet
railway link

# Déployer
railway up
```

### 4. Variables d'Environnement à Configurer

Dans Railway, allez dans **Variables** et ajoutez :

```env
MONGO_URI=mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn
JWT_SECRET=musee_des_civilisations_noires_secret_key_2024
ADMIN_EMAIL=mcn@mcn.sn
ADMIN_PASSWORD=museedescivilisationsnoire
```

### 5. Vérifier le Déploiement

```bash
# Test de santé
curl https://votre-app.railway.app/api/health

# Test de connexion admin
curl -X POST https://votre-app.railway.app/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mcn@mcn.sn","password":"museedescivilisationsnoire"}'
```

## 🔗 URLs Post-Déploiement

- **API Base** : `https://votre-app.railway.app/api`
- **Health Check** : `https://votre-app.railway.app/api/health`
- **Admin Login** : `POST https://votre-app.railway.app/api/auth/admin/login`

## 📱 Configuration Frontend

Une fois le backend déployé, mettez à jour votre frontend Vercel :

1. **Allez sur Vercel Dashboard**
2. **Sélectionnez votre projet frontend**
3. **Settings > Environment Variables**
4. **Ajoutez** :
   ```
   VITE_API_URL = https://votre-app.railway.app/api
   ```
5. **Redeployez** le frontend

## ✅ Checklist de Déploiement

- [ ] Repository GitHub créé
- [ ] Code poussé sur GitHub
- [ ] Railway connecté au repository
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Health check fonctionne
- [ ] Frontend configuré avec la nouvelle URL API
- [ ] Test complet de l'application

## 🆘 Dépannage

### Problème de Connexion MongoDB
- Vérifiez que `MONGO_URI` est correct
- Vérifiez que votre cluster MongoDB est actif

### Problème de Variables d'Environnement
- Vérifiez que toutes les variables sont configurées
- Redéployez après avoir ajouté les variables

### Problème de CORS
- Vérifiez que `FRONTEND_URL` pointe vers votre frontend Vercel

---

**Déploiement réussi ! 🎉**

Votre API est maintenant accessible et votre frontend peut s'y connecter !
