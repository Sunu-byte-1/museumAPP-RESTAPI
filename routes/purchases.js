/**
 * Routes des achats
 * 
 * Responsabilités:
 * - Gérer les achats de billets
 * - Générer des QR codes pour les achats
 * - Gérer les validations de billets
 * - Gérer les statistiques des ventes
 */

import express from 'express';
import QRCode from 'qrcode';
import Purchase from '../models/Purchase.js';
import Ticket from '../models/Ticket.js';
import { authenticate, requireUser } from '../middleware/auth.js';
import { validatePurchase, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/purchases
 * @desc    Créer un nouvel achat
 * @access  Private (User)
 */
router.post('/', authenticate, requireUser, validatePurchase, async (req, res) => {
  try {
    const { customer, items, paymentMethod, notes } = req.body;
    
    // Vérifier la disponibilité des billets et calculer les totaux
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      const ticket = await Ticket.findById(item.ticketId);
      
      if (!ticket) {
        return res.status(400).json({
          success: false,
          message: `Billet avec l'ID ${item.ticketId} non trouvé`
        });
      }
      
      if (!ticket.isAvailableForPurchase(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Billet "${ticket.type}" non disponible en quantité ${item.quantity}`
        });
      }
      
      const itemTotal = ticket.price * item.quantity;
      subtotal += itemTotal;
      
      processedItems.push({
        ticketId: ticket._id,
        ticketType: ticket.type,
        quantity: item.quantity,
        unitPrice: ticket.price,
        totalPrice: itemTotal
      });
    }
    
    // Calculer les totaux finaux
    const tax = subtotal * 0.18; // TVA de 18%
    const total = subtotal + tax;
    
    // Générer un QR code unique pour l'achat
    const purchaseId = `PUR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const qrCodeBase64 = await QRCode.toDataURL(purchaseId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Créer l'achat
    const purchase = new Purchase({
      customer: {
        userId: req.user.id,
        ...customer
      },
      items: processedItems,
      subtotal,
      tax,
      total,
      qrCode: purchaseId,
      qrCodeBase64,
      paymentMethod,
      notes,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    await purchase.save();
    
    // Réserver le stock des billets
    for (const item of processedItems) {
      const ticket = await Ticket.findById(item.ticketId);
      await ticket.reserveStock(item.quantity);
      await ticket.updateStats(item.quantity, item.totalPrice);
    }
    
    // Populate les informations des billets
    await purchase.populate('items.ticketId', 'type description price');
    
    res.status(201).json({
      success: true,
      message: 'Achat créé avec succès',
      data: purchase
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'achat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'achat'
    });
  }
});

/**
 * @route   GET /api/purchases
 * @desc    Obtenir les achats de l'utilisateur connecté
 * @access  Private (User)
 */
router.get('/', authenticate, requireUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // Construire les filtres
    const filters = { 'customer.userId': req.user.id };
    if (status) filters.status = status;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les achats
    const purchases = await Purchase.find(filters)
      .populate('items.ticketId', 'type description price')
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Compter le total
    const total = await Purchase.countDocuments(filters);
    
    res.json({
      success: true,
      data: purchases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des achats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des achats'
    });
  }
});

/**
 * @route   GET /api/purchases/:id
 * @desc    Obtenir un achat par ID
 * @access  Private (User)
 */
router.get('/:id', authenticate, requireUser, validateObjectId('id'), async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      'customer.userId': req.user.id
    }).populate('items.ticketId', 'type description price');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Achat non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: purchase
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'achat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'achat'
    });
  }
});

/**
 * @route   POST /api/purchases/validate
 * @desc    Valider un billet par QR code
 * @access  Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code requis'
      });
    }
    
    const purchase = await Purchase.findOne({ qrCode })
      .populate('items.ticketId', 'type description price');
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'QR code invalide'
      });
    }
    
    // Valider l'achat
    const validation = purchase.validatePurchase();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    res.json({
      success: true,
      message: 'Billet valide',
      data: purchase
    });
    
  } catch (error) {
    console.error('Erreur lors de la validation du billet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du billet'
    });
  }
});

/**
 * @route   PATCH /api/purchases/:id/cancel
 * @desc    Annuler un achat
 * @access  Private (User)
 */
router.patch('/:id/cancel', authenticate, requireUser, validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      'customer.userId': req.user.id
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Achat non trouvé'
      });
    }
    
    // Annuler l'achat
    await purchase.cancelPurchase(reason);
    
    // Libérer le stock des billets
    for (const item of purchase.items) {
      const ticket = await Ticket.findById(item.ticketId);
      if (ticket) {
        await ticket.releaseStock(item.quantity);
      }
    }
    
    res.json({
      success: true,
      message: 'Achat annulé avec succès',
      data: purchase
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'achat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de l\'achat'
    });
  }
});

/**
 * @route   GET /api/purchases/stats/overview
 * @desc    Obtenir les statistiques des ventes (Admin seulement)
 * @access  Private (Admin)
 */
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits administrateur requis.'
      });
    }
    
    const { startDate, endDate } = req.query;
    
    // Statistiques générales
    const totalPurchases = await Purchase.countDocuments();
    const confirmedPurchases = await Purchase.countDocuments({ status: 'confirmed' });
    const cancelledPurchases = await Purchase.countDocuments({ status: 'cancelled' });
    
    // Statistiques de revenus
    const revenueStats = await Purchase.getSalesStats(startDate, endDate);
    
    // Statistiques par statut
    const statusStats = await Purchase.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Statistiques par méthode de paiement
    const paymentStats = await Purchase.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalPurchases,
        confirmedPurchases,
        cancelledPurchases,
        revenueStats: revenueStats[0] || { totalSales: 0, totalPurchases: 0, averagePurchase: 0 },
        statusStats,
        paymentStats
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
