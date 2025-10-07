/**
 * Configuration de la connexion à la base de données MongoDB
 * 
 * Responsabilités:
 * - Établir la connexion à MongoDB avec Mongoose
 * - Gérer les événements de connexion (succès, erreur, déconnexion)
 * - Configurer les options de connexion pour la production
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Configuration de la connexion MongoDB
 */
const connectDB = async () => {
  try {
    // Options de connexion optimisées pour la production
    const options = {
      maxPoolSize: 10, // Nombre maximum de connexions dans le pool
      serverSelectionTimeoutMS: 5000, // Timeout pour la sélection du serveur
      socketTimeoutMS: 45000, // Timeout pour les opérations socket
    };

    // Établir la connexion avec l'URI MongoDB fourni
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn';
    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    
    // Événements de connexion
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connecté à MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose déconnecté de MongoDB');
    });

    // Gestion propre de la fermeture
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 Connexion MongoDB fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

export default connectDB;
