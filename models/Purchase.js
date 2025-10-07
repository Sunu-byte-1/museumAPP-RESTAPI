/**
 * Modèle achat pour MongoDB
 * 
 * Responsabilités:
 * - Définir le schéma des achats avec validation
 * - Gérer les informations client et les billets achetés
 * - Générer et valider les QR codes d'achat
 * - Tracker le statut des achats
 */

import mongoose from 'mongoose';

/**
 * Schéma achat avec validation complète
 */
const purchaseSchema = new mongoose.Schema({
  // Informations client
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'ID utilisateur est requis']
    },
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
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Veuillez fournir un email valide'
      ]
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[\+]?[0-9\s\-\(\)]{10,15}$/,
        'Veuillez fournir un numéro de téléphone valide'
      ]
    }
  },
  
  // Détails de l'achat
  items: [{
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true
    },
    ticketType: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'La quantité est requise'],
      min: [1, 'La quantité doit être d\'au moins 1'],
      max: [20, 'La quantité ne peut pas dépasser 20']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Le prix unitaire est requis'],
      min: [0, 'Le prix unitaire ne peut pas être négatif']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Le prix total est requis'],
      min: [0, 'Le prix total ne peut pas être négatif']
    }
  }],
  
  // Totaux et paiement
  subtotal: {
    type: Number,
    required: [true, 'Le sous-total est requis'],
    min: [0, 'Le sous-total ne peut pas être négatif']
  },
  
  tax: {
    type: Number,
    default: 0,
    min: [0, 'La taxe ne peut pas être négative']
  },
  
  discount: {
    type: Number,
    default: 0,
    min: [0, 'La remise ne peut pas être négative']
  },
  
  total: {
    type: Number,
    required: [true, 'Le total est requis'],
    min: [0, 'Le total ne peut pas être négatif']
  },
  
  // Statut et validation
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cancelled', 'refunded', 'expired'],
      message: 'Le statut doit être une des valeurs autorisées'
    },
    default: 'pending'
  },
  
  // QR Code et validation
  qrCode: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  
  qrCodeBase64: {
    type: String,
    required: true
  },
  
  // Dates importantes
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  
  validFrom: {
    type: Date,
    default: Date.now
  },
  
  validUntil: {
    type: Date,
    required: [true, 'La date d\'expiration est requise']
  },
  
  // Informations de paiement
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'mobile_money', 'bank_transfer'],
      message: 'La méthode de paiement doit être une des valeurs autorisées'
    },
    required: [true, 'La méthode de paiement est requise']
  },
  
  paymentReference: {
    type: String,
    trim: true
  },
  
  // Notes et commentaires
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  },
  
  // Métadonnées
  ipAddress: {
    type: String,
    trim: true
  },
  
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Index pour optimiser les requêtes
 */
purchaseSchema.index({ 'customer.userId': 1 });
purchaseSchema.index({ 'customer.email': 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ qrCode: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ validUntil: 1 });

/**
 * Virtual pour vérifier si l'achat est valide
 */
purchaseSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'confirmed' && 
         this.validFrom <= now && 
         this.validUntil >= now;
});

/**
 * Virtual pour vérifier si l'achat est expiré
 */
purchaseSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

/**
 * Virtual pour le nombre total d'articles
 */
purchaseSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Virtual pour le total formaté
 */
purchaseSchema.virtual('formattedTotal').get(function() {
  return `${this.total.toLocaleString('fr-FR')} FCFA`;
});

/**
 * Méthode pour valider un achat
 */
purchaseSchema.methods.validatePurchase = function() {
  if (this.status !== 'confirmed') {
    return { valid: false, error: 'Achat non confirmé' };
  }
  
  if (this.isExpired) {
    return { valid: false, error: 'Achat expiré' };
  }
  
  return { valid: true, purchase: this };
};

/**
 * Méthode pour annuler un achat
 */
purchaseSchema.methods.cancelPurchase = function(reason = '') {
  if (this.status === 'confirmed') {
    this.status = 'cancelled';
    this.notes = this.notes ? `${this.notes}\nAnnulé: ${reason}` : `Annulé: ${reason}`;
    return this.save();
  }
  return Promise.reject(new Error('Impossible d\'annuler un achat non confirmé'));
};

/**
 * Méthode pour rembourser un achat
 */
purchaseSchema.methods.refundPurchase = function(reason = '') {
  if (this.status === 'confirmed' || this.status === 'cancelled') {
    this.status = 'refunded';
    this.notes = this.notes ? `${this.notes}\nRemboursé: ${reason}` : `Remboursé: ${reason}`;
    return this.save();
  }
  return Promise.reject(new Error('Impossible de rembourser cet achat'));
};

/**
 * Méthode statique pour obtenir les achats d'un utilisateur
 */
purchaseSchema.statics.getUserPurchases = function(userId, limit = 20) {
  return this.find({ 'customer.userId': userId })
    .populate('items.ticketId', 'type description price')
    .sort({ purchaseDate: -1 })
    .limit(limit);
};

/**
 * Méthode statique pour obtenir les statistiques de vente
 */
purchaseSchema.statics.getSalesStats = function(startDate, endDate) {
  const matchStage = {
    status: 'confirmed'
  };
  
  if (startDate && endDate) {
    matchStage.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalPurchases: { $sum: 1 },
        averagePurchase: { $avg: '$total' }
      }
    }
  ]);
};

export default mongoose.model('Purchase', purchaseSchema);
