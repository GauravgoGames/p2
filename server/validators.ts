import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation rules
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must not exceed 50 characters')
    .escape(),
];

export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Match validation rules
export const validateCreateMatch = [
  body('tournamentId')
    .isInt({ min: 1 })
    .withMessage('Invalid tournament ID'),
  body('team1Id')
    .isInt({ min: 1 })
    .withMessage('Invalid team 1 ID'),
  body('team2Id')
    .isInt({ min: 1 })
    .withMessage('Invalid team 2 ID')
    .custom((value, { req }) => value !== req.body.team1Id)
    .withMessage('Teams must be different'),
  body('matchTime')
    .isISO8601()
    .withMessage('Invalid match time'),
  body('venue')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Venue must not exceed 100 characters')
    .escape(),
];

// Prediction validation rules
export const validateCreatePrediction = [
  body('matchId')
    .isInt({ min: 1 })
    .withMessage('Invalid match ID'),
  body('predictedTossWinnerId')
    .isInt({ min: 1 })
    .withMessage('Invalid toss winner ID'),
  body('predictedMatchWinnerId')
    .isInt({ min: 1 })
    .withMessage('Invalid match winner ID'),
];

// Tournament validation rules
export const validateCreateTournament = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tournament name must be between 3 and 100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape(),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid image URL'),
];

// Common parameter validations
export const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
];

export const validateUsername = [
  param('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .escape(),
];

// Query validations
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const validateTimeframeQuery = [
  query('timeframe')
    .optional()
    .isIn(['all', 'week', 'month'])
    .withMessage('Invalid timeframe'),
];

// Support ticket validation
export const validateCreateTicket = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters')
    .escape(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level'),
];

export const validateTicketMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .escape(),
];

// File upload validation
export const validateImageUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' });
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ message: 'File size must not exceed 5MB.' });
  }

  next();
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .toLowerCase();
};