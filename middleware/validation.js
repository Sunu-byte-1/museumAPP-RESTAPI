/**
 * Middleware de validation pour Express
 * 
 * Responsabilités:
 * - Valider les données d'entrée avec express-validator
 * - Gérer les erreurs de validation
 * - Fournir des messages d'erreur en français
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware pour gérer les erreurs de validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Données de validation invalides',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Règles de validation pour l'authentification utilisateur
 */
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour l'inscription utilisateur
 */
export const validateUserRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Le nom ne peut contenir que des lettres'),
  
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 6 et 128 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Veuillez fournir un numéro de téléphone valide'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour l'authentification admin
 */
export const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour les œuvres
 */
export const validateArtwork = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Le titre doit contenir entre 2 et 200 caractères'),
  
  body('artist')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'artiste doit contenir entre 2 et 100 caractères'),
  
  body('year')
    .isInt({ min: -5000, max: new Date().getFullYear() + 1 })
    .withMessage('L\'année doit être réaliste'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères'),
  
  body('image')
    .notEmpty()
    .withMessage('L\'image est requise'),
  
  body('category')
    .isIn(['Peinture', 'Sculpture', 'Photographie', 'Art numérique', 'Installation', 'Autre'])
    .withMessage('La catégorie doit être une des valeurs autorisées'),
  
  body('room')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la salle doit contenir entre 2 et 100 caractères'),
  
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Le prix doit être entre 0 et 10000 FCFA'),
  
  body('audioGuide')
    .optional()
    .isURL()
    .withMessage('L\'URL du guide audio doit être valide'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour les billets
 */
export const validateTicket = [
  body('type')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le type de billet doit contenir entre 2 et 100 caractères'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La description doit contenir entre 10 et 500 caractères'),
  
  body('price')
    .isFloat({ min: 0, max: 50000 })
    .withMessage('Le prix doit être entre 0 et 50000 FCFA'),
  
  body('category')
    .isIn(['Entrée', 'Visite guidée', 'Événement', 'Abonnement', 'Groupe', 'Réduction'])
    .withMessage('La catégorie doit être une des valeurs autorisées'),
  
  body('stock')
    .optional()
    .isInt({ min: -1 })
    .withMessage('Le stock doit être un entier positif ou -1 pour illimité'),
  
  body('validityDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('La validité doit être entre 1 et 365 jours'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour les achats
 */
export const validatePurchase = [
  body('customer.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('customer.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('customer.email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  
  body('customer.phone')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Veuillez fournir un numéro de téléphone valide'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Au moins un article est requis'),
  
  body('items.*.ticketId')
    .isMongoId()
    .withMessage('ID de billet invalide'),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 20 })
    .withMessage('La quantité doit être entre 1 et 20'),
  
  body('paymentMethod')
    .isIn(['cash', 'card', 'mobile_money', 'bank_transfer'])
    .withMessage('Méthode de paiement invalide'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour les paramètres d'URL
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('ID invalide'),
  
  handleValidationErrors
];

/**
 * Règles de validation pour les requêtes de recherche
 */
export const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La requête de recherche doit contenir entre 2 et 100 caractères'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La catégorie doit contenir entre 2 et 50 caractères'),
  
  handleValidationErrors
];
