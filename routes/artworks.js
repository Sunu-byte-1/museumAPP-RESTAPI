/**
 * Routes des œuvres d'art
 * 
 * Responsabilités:
 * - Gérer les CRUD des œuvres d'art
 * - Générer des QR codes uniques pour chaque œuvre
 * - Gérer la recherche et les filtres
 * - Gérer les statistiques des œuvres
 */

import express from 'express';
import QRCode from 'qrcode';
import Artwork from '../models/Artwork.js';
import { authenticate, requireAdmin, requireUser } from '../middleware/auth.js';
import { validateArtwork, validateObjectId, validateSearchQuery } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/artworks
 * @desc    Obtenir la liste des œuvres avec recherche et filtres
 * @access  Public
 */
router.get('/', validateSearchQuery, async (req, res) => {
  try {
    const { q, category, room, page = 1, limit = 20 } = req.query;
    
    // Construire les filtres de recherche
    const filters = {};
    
    if (category) filters.category = category;
    if (room) filters.room = room;
    
    // Recherche textuelle
    let searchQuery = {};
    if (q) {
      searchQuery = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { artist: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      };
    }
    
    // Combiner les filtres
    const finalFilters = { ...filters, ...searchQuery };
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les œuvres
    const artworks = await Artwork.find(finalFilters)
      .populate('addedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Compter le total
    const total = await Artwork.countDocuments(finalFilters);
    
    res.json({
      success: true,
      data: artworks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des œuvres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des œuvres'
    });
  }
});

/**
 * @route   GET /api/artworks/:id
 * @desc    Obtenir une œuvre par ID
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('addedBy', 'firstName lastName email');
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Œuvre non trouvée'
      });
    }
    
    // Incrémenter le compteur de vues
    await artwork.incrementViewCount();
    
    res.json({
      success: true,
      data: artwork
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'œuvre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'œuvre'
    });
  }
});

/**
 * @route   GET /api/artworks/qr/:qrCode
 * @desc    Obtenir une œuvre par QR code
 * @access  Public
 */
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const artwork = await Artwork.findOne({ qrCode })
      .populate('addedBy', 'firstName lastName email');
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'QR code invalide ou œuvre non trouvée'
      });
    }
    
    if (!artwork.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Cette œuvre n\'est plus disponible'
      });
    }
    
    // Incrémenter le compteur de scans
    await artwork.incrementScanCount();
    
    res.json({
      success: true,
      data: artwork
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération par QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération par QR code'
    });
  }
});

/**
 * @route   POST /api/artworks
 * @desc    Créer une nouvelle œuvre (Admin seulement)
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireAdmin, validateArtwork, async (req, res) => {
  try {
    const artworkData = req.body;
    
    // Générer un QR code unique
    const qrCodeId = `QR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Générer le QR code en base64
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Créer l'œuvre
    const artwork = new Artwork({
      ...artworkData,
      qrCode: qrCodeId,
      qrCodeBase64,
      addedBy: req.user.id
    });
    
    await artwork.save();
    
    // Populate les informations de l'ajouteur
    await artwork.populate('addedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Œuvre créée avec succès',
      data: artwork
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'œuvre:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Une œuvre avec ce QR code existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'œuvre'
    });
  }
});

/**
 * @route   PUT /api/artworks/:id
 * @desc    Mettre à jour une œuvre (Admin seulement)
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireAdmin, validateObjectId('id'), validateArtwork, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Œuvre non trouvée'
      });
    }
    
    // Mettre à jour l'œuvre
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('addedBy', 'firstName lastName email');
    
    res.json({
      success: true,
      message: 'Œuvre mise à jour avec succès',
      data: updatedArtwork
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'œuvre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'œuvre'
    });
  }
});

/**
 * @route   DELETE /api/artworks/:id
 * @desc    Supprimer une œuvre (Admin seulement)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Œuvre non trouvée'
      });
    }
    
    await Artwork.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Œuvre supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'œuvre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'œuvre'
    });
  }
});

/**
 * @route   PATCH /api/artworks/:id/toggle-availability
 * @desc    Basculer la disponibilité d'une œuvre (Admin seulement)
 * @access  Private (Admin)
 */
router.patch('/:id/toggle-availability', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Œuvre non trouvée'
      });
    }
    
    artwork.isAvailable = !artwork.isAvailable;
    await artwork.save();
    
    res.json({
      success: true,
      message: `Œuvre ${artwork.isAvailable ? 'activée' : 'désactivée'} avec succès`,
      data: artwork
    });
    
  } catch (error) {
    console.error('Erreur lors du changement de disponibilité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de disponibilité'
    });
  }
});

/**
 * @route   GET /api/artworks/stats/popular
 * @desc    Obtenir les œuvres populaires
 * @access  Public
 */
router.get('/stats/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularArtworks = await Artwork.getPopularArtworks(parseInt(limit));
    
    res.json({
      success: true,
      data: popularArtworks
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des œuvres populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des œuvres populaires'
    });
  }
});

/**
 * @route   GET /api/artworks/stats/overview
 * @desc    Obtenir les statistiques générales (Admin seulement)
 * @access  Private (Admin)
 */
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalArtworks = await Artwork.countDocuments();
    const availableArtworks = await Artwork.countDocuments({ isAvailable: true });
    const totalViews = await Artwork.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);
    const totalScans = await Artwork.aggregate([
      { $group: { _id: null, total: { $sum: '$scanCount' } } }
    ]);
    
    const categoryStats = await Artwork.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const roomStats = await Artwork.aggregate([
      { $group: { _id: '$room', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalArtworks,
        availableArtworks,
        totalViews: totalViews[0]?.total || 0,
        totalScans: totalScans[0]?.total || 0,
        categoryStats,
        roomStats
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;
