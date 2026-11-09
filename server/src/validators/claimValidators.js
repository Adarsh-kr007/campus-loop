import { body, param, query } from 'express-validator'

export const createClaimValidators = [
  body('itemId').isMongoId().withMessage('Valid item ID is required'),
  body('claimantName').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('claimantEmail').trim().isEmail().withMessage('Valid email is required').isLength({ max: 100 }).customSanitizer((value) => value.toLowerCase()),
  body('identifyingDetails').trim().isLength({ min: 20, max: 1000 }).withMessage('Identifying details must be 20 to 1000 characters'),
  body('ownershipReason').trim().isLength({ min: 20, max: 1000 }).withMessage('Ownership reason must be 20 to 1000 characters'),
]

export const claimIdValidator = [param('id').isMongoId().withMessage('Invalid claim ID')]
export const claimStatusValidator = [body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')]
export const claimQueryValidators = [query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid claim status'), query('page').optional().matches(/^\d+$/), query('limit').optional().matches(/^\d+$/)]
