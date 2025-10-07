/**
 * Modèle utilisateur pour MongoDB
 * 
 * Responsabilités:
 * - Définir le schéma utilisateur avec validation
 * - Gérer l'authentification (hashage mot de passe)
 * - Distinguer les rôles (user/admin)
 * - Valider les données utilisateur
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Schéma utilisateur avec validation complète
 */
const userSchema = new mongoose.Schema({
  // Informations personnelles
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Veuillez fournir un email valide'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[0-9\s\-\(\)]{8,20}$/,
      'Veuillez fournir un numéro de téléphone valide'
    ]
  },
  
  // Rôle utilisateur (user ou admin)
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Le rôle doit être soit "user" soit "admin"'
    },
    default: 'user'
  },
  
  // Statut du compte
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Date de dernière connexion
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Historique des achats (références vers les purchases)
  purchases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  }]
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Index pour optimiser les requêtes
 */
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

/**
 * Virtual pour le nom complet
 */
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Middleware pre-save: hashage automatique du mot de passe
 */
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    // Hashage avec un salt de 12 rounds
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Méthode pour comparer les mots de passe
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Méthode pour mettre à jour la dernière connexion
 */
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

/**
 * Méthode statique pour créer un admin par défaut
 */
userSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      const admin = new this({
        firstName: 'Admin',
        lastName: 'MCN',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        phone: '+221 33 123 45 67'
      });
      
      await admin.save();
      console.log('✅ Admin par défaut créé:', admin.email);
    } else {
      console.log('ℹ️ Admin par défaut existe déjà:', adminExists.email);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin par défaut:', error);
  }
};

export default mongoose.model('User', userSchema);
