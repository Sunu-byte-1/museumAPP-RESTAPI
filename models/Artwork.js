/**
 * Modèle œuvre d'art pour MongoDB
 * 
 * Responsabilités:
 * - Définir le schéma des œuvres avec validation complète
 * - Gérer la génération et stockage des QR codes
 * - Valider les données d'œuvres
 * - Optimiser les requêtes avec des index
 */

import mongoose from 'mongoose';

/**
 * Schéma œuvre d'art avec validation complète
 */
const artworkSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    minlength: [2, 'Le titre doit contenir au moins 2 caractères'],
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  
  artist: {
    type: String,
    required: [true, 'Le nom de l\'artiste est requis'],
    trim: true,
    minlength: [2, 'Le nom de l\'artiste doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom de l\'artiste ne peut pas dépasser 100 caractères']
  },
  
  year: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: [-5000, 'L\'année doit être réaliste'],
    max: [new Date().getFullYear() + 1, 'L\'année ne peut pas être dans le futur']
  },
  
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    minlength: [10, 'La description doit contenir au moins 10 caractères'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  
  // Images et médias
  image: {
    type: String,
    required: [true, 'L\'image est requise'],
    trim: true
  },
  
  audioGuide: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'L\'URL du guide audio doit être valide'
    }
  },
  
  // Classification
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['Peinture', 'Sculpture', 'Photographie', 'Art numérique', 'Installation', 'Autre'],
      message: 'La catégorie doit être une des valeurs autorisées'
    }
  },
  
  room: {
    type: String,
    required: [true, 'La salle est requise'],
    trim: true,
    minlength: [2, 'Le nom de la salle doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom de la salle ne peut pas dépasser 100 caractères']
  },
  
  // QR Code et identification
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
  
  // Prix et disponibilité
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif'],
    max: [10000, 'Le prix ne peut pas dépasser 10000 FCFA']
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Métadonnées
  dimensions: {
    width: Number,
    height: Number,
    depth: Number,
    unit: {
      type: String,
      enum: ['cm', 'm', 'mm'],
      default: 'cm'
    }
  },
  
  materials: [{
    type: String,
    trim: true
  }],
  
  techniques: [{
    type: String,
    trim: true
  }],
  
  // Statistiques
  viewCount: {
    type: Number,
    default: 0
  },
  
  scanCount: {
    type: Number,
    default: 0
  },
  
  // Référence à l'utilisateur qui a ajouté l'œuvre
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Index pour optimiser les requêtes
 */
artworkSchema.index({ title: 'text', artist: 'text', description: 'text' });
artworkSchema.index({ category: 1 });
artworkSchema.index({ room: 1 });
artworkSchema.index({ isAvailable: 1 });
// Index qrCode déjà défini avec unique: true
artworkSchema.index({ addedBy: 1 });

/**
 * Virtual pour l'URL complète de l'image
 */
artworkSchema.virtual('imageUrl').get(function() {
  if (this.image.startsWith('http')) {
    return this.image;
  }
  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${this.image}`;
});

/**
 * Virtual pour l'âge de l'œuvre
 */
artworkSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

/**
 * Méthode pour incrémenter le compteur de vues
 */
artworkSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

/**
 * Méthode pour incrémenter le compteur de scans
 */
artworkSchema.methods.incrementScanCount = function() {
  this.scanCount += 1;
  return this.save({ validateBeforeSave: false });
};

/**
 * Méthode statique pour rechercher des œuvres
 */
artworkSchema.statics.searchArtworks = function(query, filters = {}) {
  const searchQuery = {};
  
  // Recherche textuelle
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Filtres additionnels
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.room) {
    searchQuery.room = filters.room;
  }
  
  if (filters.isAvailable !== undefined) {
    searchQuery.isAvailable = filters.isAvailable;
  }
  
  return this.find(searchQuery)
    .populate('addedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

/**
 * Méthode statique pour obtenir les œuvres populaires
 */
artworkSchema.statics.getPopularArtworks = function(limit = 10) {
  return this.find({ isAvailable: true })
    .sort({ viewCount: -1, scanCount: -1 })
    .limit(limit)
    .populate('addedBy', 'firstName lastName');
};

export default mongoose.model('Artwork', artworkSchema);
