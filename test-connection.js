/**
 * Script de test de connexion MongoDB
 * 
 * Ce script teste la connexion à la base de données MongoDB
 * et affiche les informations de connexion
 */

import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://abdallahdiouf_db_user:uQmfAYZBzQrhQk5w@mcn.ktehafd.mongodb.net/?retryWrites=true&w=majority&appName=mcn';

console.log('🔗 Test de connexion MongoDB...');
console.log('📡 URI:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials

async function testConnection() {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(MONGO_URI, options);
    
    console.log('✅ Connexion MongoDB réussie !');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(`👤 User: ${conn.connection.user}`);
    
    // Tester une opération simple
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📁 Collections existantes: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('📋 Collections:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    console.log('🎉 Test de connexion terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    
    if (error.name === 'MongoServerError') {
      console.error('🔍 Vérifiez vos credentials MongoDB');
    } else if (error.name === 'MongoNetworkError') {
      console.error('🌐 Vérifiez votre connexion internet');
    } else {
      console.error('🔧 Erreur technique:', error);
    }
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔒 Connexion fermée');
    process.exit(0);
  }
}

// Lancer le test
testConnection();
