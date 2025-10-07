/**
 * Modèle billet pour MongoDB
 * 
 * Responsabilités:
 * - Définir le schéma des billets avec validation
 * - Gérer les types de billets et leurs prix
 * - Valider la disponibilité et les contraintes
 */

import mongoose from 'mongoose';

/**
 * Schéma billet avec validation complète
 */
const ticketSchema = new mongoose.Schema({
  // Informations de base
  type: {
    type: String,
    required: [true, 'Le type de billet est requis'],
    trim: true,
    minlength: [2, 'Le type doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le type ne peut pas dépasser 100 caractères']
  },
  
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
    max: [50000, 'Le prix ne peut pas dépasser 50000 FCFA']
  },
  
  // Disponibilité et stock
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  stock: {
    type: Number,
    default: -1, // -1 = stock illimité, sinon nombre d'unités disponibles
    min: [-1, 'Le stock ne peut pas être inférieur à -1']
  },
  
  // Durée de validité
  validityDays: {
    type: Number,
    default: 30, // Validité par défaut de 30 jours
    min: [1, 'La validité doit être d\'au moins 1 jour'],
    max: [365, 'La validité ne peut pas dépasser 365 jours']
  },
  
  // Restrictions d'âge
  ageRestrictions: {
    minAge: {
      type: Number,
      min: [0, 'L\'âge minimum ne peut pas être négatif'],
      max: [18, 'L\'âge minimum ne peut pas dépasser 18 ans']
    },
    maxAge: {
      type: Number,
      min: [0, 'L\'âge maximum ne peut pas être négatif'],
      max: [100, 'L\'âge maximum ne peut pas dépasser 100 ans']
    }
  },
  
  // Avantages inclus
  benefits: [{
    type: String,
    trim: true
  }],
  
  // Restrictions d'usage
  restrictions: [{
    type: String,
    trim: true
  }],
  
  // Catégorie de billet
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['Entrée', 'Visite guidée', 'Événement', 'Abonnement', 'Groupe', 'Réduction'],
      message: 'La catégorie doit être une des valeurs autorisées'
    }
  },
  
  // Référence à l'utilisateur qui a créé le billet
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Statistiques
  purchaseCount: {
    type: Number,
    default: 0
  },
  
  revenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Index pour optimiser les requêtes
 */
ticketSchema.index({ type: 'text', description: 'text' });
ticketSchema.index({ category: 1 });
ticketSchema.index({ isAvailable: 1 });
ticketSchema.index({ price: 1 });
ticketSchema.index({ createdBy: 1 });

/**
 * Virtual pour vérifier si le billet est en stock
 */
ticketSchema.virtual('inStock').get(function() {
  return this.stock === -1 || this.stock > 0;
});

/**
 * Virtual pour le prix formaté
 */
ticketSchema.virtual('formattedPrice').get(function() {
  return `${this.price.toLocaleString('fr-FR')} FCFA`;
});

/**
 * Méthode pour vérifier la disponibilité
 */
ticketSchema.methods.isAvailableForPurchase = function(quantity = 1) {
  if (!this.isAvailable) return false;
  if (this.stock === -1) return true; // Stock illimité
  return this.stock >= quantity;
};

/**
 * Méthode pour réserver du stock
 */
ticketSchema.methods.reserveStock = function(quantity = 1) {
  if (this.stock === -1) return true; // Stock illimité
  
  if (this.stock >= quantity) {
    this.stock -= quantity;
    return this.save({ validateBeforeSave: false });
  }
  return false;
};

/**
 * Méthode pour libérer du stock
 */
ticketSchema.methods.releaseStock = function(quantity = 1) {
  if (this.stock === -1) return true; // Stock illimité
  
  this.stock += quantity;
  return this.save({ validateBeforeSave: false });
};

/**
 * Méthode pour mettre à jour les statistiques
 */
ticketSchema.methods.updateStats = function(quantity, totalPrice) {
  this.purchaseCount += quantity;
  this.revenue += totalPrice;
  return this.save({ validateBeforeSave: false });
};

/**
 * Méthode statique pour obtenir les billets disponibles
 */
ticketSchema.statics.getAvailableTickets = function() {
  return this.find({ 
    isAvailable: true,
    $or: [
      { stock: -1 },
      { stock: { $gt: 0 } }
    ]
  }).sort({ price: 1 });
};

/**
 * Méthode statique pour obtenir les billets populaires
 */
ticketSchema.statics.getPopularTickets = function(limit = 10) {
  return this.find({ isAvailable: true })
    .sort({ purchaseCount: -1 })
    .limit(limit);
};

export default mongoose.model('Ticket', ticketSchema);
