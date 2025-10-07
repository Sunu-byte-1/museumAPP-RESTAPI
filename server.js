/**
 * Serveur Express principal pour l'API Musée des Civilisations Noires
 * 
 * Responsabilités:
 * - Configurer et démarrer le serveur Express
 * - Gérer les connexions à la base de données
 * - Configurer les middlewares de sécurité
 * - Définir les routes API
 * - Gérer les erreurs globales
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des configurations et routes
import connectDB from './config/database.js';
import User from './models/User.js';

// Import des routes
import authRoutes from './routes/auth.js';
import artworkRoutes from './routes/artworks.js';
import ticketRoutes from './routes/tickets.js';
import purchaseRoutes from './routes/purchases.js';

// Configuration des variables d'environnement
dotenv.config();

// Configuration MongoDB par défaut si .env n'est pas disponible
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'musee_des_civilisations_noires_secret_key_2024';
}
if (!process.env.ADMIN_EMAIL) {
  process.env.ADMIN_EMAIL = 'mcn@mcn.sn';
}
if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_PASSWORD = 'museedescivilisationsnoire';
}
if (!process.env.PORT) {
  process.env.PORT = '5001';
}

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialiser l'application Express
const app = express();

// Connexion à la base de données
connectDB();

// ===========================================
// Configuration des middlewares de sécurité
// ===========================================

// Helmet pour la sécurité des en-têtes HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuration CORS

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://musee-des-civilisations-noires.vercel.app'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (applications mobiles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Autoriser tous les domaines Vercel (pour les previews)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Origin non autorisée
    console.log('❌ Origin non autorisée:', origin);
    callback(new Error('Non autorisé par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Limitation du taux de requêtes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par IP toutes les 15 minutes
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Limitation plus stricte pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives de connexion par IP toutes les 15 minutes
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

// ===========================================
// Middlewares de parsing et configuration
// ===========================================

// Parser JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour logger les requêtes (développement)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===========================================
// Routes API
// ===========================================

// Route de santé du serveur
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Musée des Civilisations Noires - Serveur opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des œuvres
app.use('/api/artworks', artworkRoutes);

// Routes des billets
app.use('/api/tickets', ticketRoutes);

// Routes des achats
app.use('/api/purchases', purchaseRoutes);

// ===========================================
// Gestion des erreurs
// ===========================================

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
});

// Middleware global de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Erreur de validation Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
  
  // Erreur de duplication MongoDB
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} existe déjà`
    });
  }
  
  // Erreur JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }
  
  // Erreur CORS
  if (error.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
  
  // Erreur serveur par défaut
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : error.message
  });
});

// ===========================================
// Initialisation et démarrage du serveur
// ===========================================

// Créer l'admin par défaut au démarrage
const initializeDefaultAdmin = async () => {
  try {
    await User.createDefaultAdmin();
  } catch (error) {
    console.error('Erreur lors de la création de l\'admin par défaut:', error);
  }
};

// Port du serveur
const PORT = process.env.PORT || 5001;

// Démarrer le serveur
const startServer = async () => {
  try {
    // Initialiser l'admin par défaut
    await initializeDefaultAdmin();
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`
🚀 Serveur Musée des Civilisations Noires démarré
📡 Port: ${PORT}
🌍 Environnement: ${process.env.NODE_ENV || 'development'}
📊 Base de données: ${process.env.MONGO_URI ? 'Connectée' : 'Non configurée'}
🔐 Admin par défaut: ${process.env.ADMIN_EMAIL || 'mcn@mcn.sn'}
      `);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu. Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu. Arrêt du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();

export default app;
