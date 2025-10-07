# 🚀 Guide de Déploiement - Backend API

## Options de Déploiement

### 1. Railway (Recommandé)

#### Déploiement Automatique
1. **Fork ce repository** sur GitHub
2. **Allez sur Railway** : https://railway.app
3. **Connectez votre compte GitHub**
4. **Sélectionnez ce repository**
5. **Configurez les variables d'environnement** (voir ci-dessous)
6. **Déployez !**

#### Déploiement via CLI
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

### 2. Vercel

#### Déploiement Automatique
1. **Fork ce repository** sur GitHub
2. **Allez sur Vercel** : https://vercel.com
3. **Importez ce repository**
4. **Configurez les variables d'environnement**
5. **Déployez !**

#### Déploiement via CLI
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### 3. Heroku

```bash
# Installer Heroku CLI
# Créer un compte Heroku
heroku login

# Créer l'application
heroku create musee-backend-api

# Configurer les variables
heroku config:set MONGO_URI="mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn"
heroku config:set JWT_SECRET="musee_des_civilisations_noires_secret_key_2024"
heroku config:set ADMIN_EMAIL="mcn@mcn.sn"
heroku config:set ADMIN_PASSWORD="museedescivilisationsnoire"

# Déployer
git push heroku main
```

## 🔧 Variables d'Environnement

### Obligatoires
```env
MONGO_URI=mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn
JWT_SECRET=musee_des_civilisations_noires_secret_key_2024
ADMIN_EMAIL=mcn@mcn.sn
ADMIN_PASSWORD=museedescivilisationsnoire
```

### Optionnelles
```env
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.vercel.app
```

## 📊 Vérification du Déploiement

### Health Check
```bash
curl https://votre-api.railway.app/api/health
```

### Test de Connexion
```bash
curl https://votre-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mcn@mcn.sn","password":"museedescivilisationsnoire"}'
```

## 🔗 URLs Post-Déploiement

- **API Base** : `https://votre-api.railway.app/api`
- **Health Check** : `https://votre-api.railway.app/api/health`
- **Documentation** : `https://votre-api.railway.app/api/docs` (si activé)

## 🛠️ Développement Local

```bash
# Cloner le repository
git clone https://github.com/votre-username/musee-backend-api.git
cd musee-backend-api

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Démarrer en développement
npm run dev
```

## 📝 Logs et Monitoring

### Railway
- **Logs** : Dashboard Railway > Logs
- **Métriques** : Dashboard Railway > Metrics

### Vercel
- **Logs** : Dashboard Vercel > Functions > Logs
- **Analytics** : Dashboard Vercel > Analytics

## 🔄 Mise à Jour

```bash
# Pull les dernières modifications
git pull origin main

# Redéployer automatiquement (si configuré)
# Ou redéployer manuellement via la plateforme
```

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de connexion MongoDB**
   - Vérifiez la variable `MONGO_URI`
   - Vérifiez que votre cluster MongoDB est actif

2. **Erreur JWT**
   - Vérifiez la variable `JWT_SECRET`
   - Assurez-vous qu'elle est identique entre les déploiements

3. **Port déjà utilisé**
   - Railway/Vercel gère automatiquement les ports
   - Vérifiez la variable `PORT` si nécessaire

### Support
- **Issues** : GitHub Issues
- **Documentation** : README.md
- **Email** : support@mcn.sn

---

**Déploiement réussi ! 🎉**
