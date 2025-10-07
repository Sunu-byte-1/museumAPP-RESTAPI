/**
 * Routes des billets
 * 
 * Responsabilités:
 * - Gérer les CRUD des billets
 * - Gérer la disponibilité et le stock
 * - Gérer les statistiques des billets
 */

import express from 'express';
import Ticket from '../models/Ticket.js';
import { authenticate, requireAdmin, requireUser } from '../middleware/auth.js';
import { validateTicket, validateObjectId, validateSearchQuery } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/tickets
 * @desc    Obtenir la liste des billets disponibles
 * @access  Public
 */
router.get('/', validateSearchQuery, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    // Construire les filtres
    const filters = { isAvailable: true };
    if (category) filters.category = category;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Récupérer les billets
    const tickets = await Ticket.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort({ price: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Compter le total
    const total = await Ticket.countDocuments(filters);
    
    res.json({
      success: true,
      data: tickets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des billets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets'
    });
  }
});

/**
 * @route   GET /api/tickets/:id
 * @desc    Obtenir un billet par ID
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: ticket
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du billet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du billet'
    });
  }
});

/**
 * @route   POST /api/tickets
 * @desc    Créer un nouveau billet (Admin seulement)
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireAdmin, validateTicket, async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const ticket = new Ticket(ticketData);
    await ticket.save();
    
    // Populate les informations du créateur
    await ticket.populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Billet créé avec succès',
      data: ticket
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du billet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du billet'
    });
  }
});

/**
 * @route   PUT /api/tickets/:id
 * @desc    Mettre à jour un billet (Admin seulement)
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireAdmin, validateObjectId('id'), validateTicket, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }
    
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');
    
    res.json({
      success: true,
      message: 'Billet mis à jour avec succès',
      data: updatedTicket
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du billet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du billet'
    });
  }
});

/**
 * @route   DELETE /api/tickets/:id
 * @desc    Supprimer un billet (Admin seulement)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }
    
    await Ticket.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Billet supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du billet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du billet'
    });
  }
});

/**
 * @route   PATCH /api/tickets/:id/toggle-availability
 * @desc    Basculer la disponibilité d'un billet (Admin seulement)
 * @access  Private (Admin)
 */
router.patch('/:id/toggle-availability', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Billet non trouvé'
      });
    }
    
    ticket.isAvailable = !ticket.isAvailable;
    await ticket.save();
    
    res.json({
      success: true,
      message: `Billet ${ticket.isAvailable ? 'activé' : 'désactivé'} avec succès`,
      data: ticket
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
 * @route   GET /api/tickets/stats/popular
 * @desc    Obtenir les billets populaires
 * @access  Public
 */
router.get('/stats/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularTickets = await Ticket.getPopularTickets(parseInt(limit));
    
    res.json({
      success: true,
      data: popularTickets
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des billets populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des billets populaires'
    });
  }
});

/**
 * @route   GET /api/tickets/stats/overview
 * @desc    Obtenir les statistiques des billets (Admin seulement)
 * @access  Private (Admin)
 */
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const availableTickets = await Ticket.countDocuments({ isAvailable: true });
    
    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const revenueStats = await Ticket.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalTickets,
        availableTickets,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        categoryStats
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
