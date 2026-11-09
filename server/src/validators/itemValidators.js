import { body, param, query } from 'express-validator'
import { CATEGORIES, ITEM_STATUSES, ITEM_TYPES, LOCATIONS } from '../constants/index.js'

const futureDate = (value) => {
  const date = parseItemDate(value)
  return date && date.getTime() <= Date.now()
}

export function parseItemDate(value) {
  if (typeof value !== 'string') return null
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!isDateOnly && !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null
  const date = new Date(isDateOnly ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return null
  if (isDateOnly && date.toISOString().slice(0, 10) !== value) return null
  return date
}

const title = () => body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3 to 100 characters')
const description = () => body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be 20 to 1000 characters')
const category = () => body('category').isIn(CATEGORIES).withMessage('Choose a valid category')
const location = () => body('location').isIn(LOCATIONS).withMessage('Choose a valid location')
const date = () => body('date').isISO8601({ strict: true, strictSeparator: true }).custom(futureDate).withMessage('Date must be a valid date that is not in the future')
const imageUrl = () => body('imageUrl').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 500 }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Image URL must be a valid HTTPS URL up to 500 characters')
const contacts = () => [
  body('contactName').trim().isLength({ min: 2, max: 60 }).withMessage('Contact name must be 2 to 60 characters'),
  body('contactEmail').trim().isEmail().withMessage('Valid contact email is required').isLength({ max: 100 }).customSanitizer((value) => value.toLowerCase()),
  body('contactPhone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Enter a valid phone number'),
]

export const createItemValidators = [body('type').isIn(ITEM_TYPES).withMessage('Type must be lost or found'), title(), description(), category(), location(), date(), imageUrl(), ...contacts()]
export const updateItemValidators = [title().optional(), description().optional(), category().optional(), location().optional(), date().optional(), imageUrl(), ...contacts().map((validator) => validator.optional()), body().custom((_, { req }) => Object.keys(req.body || {}).some((field) => ['title', 'description', 'category', 'location', 'date', 'imageUrl', 'contactName', 'contactEmail', 'contactPhone'].includes(field))).withMessage('At least one editable field is required')]
export const statusValidators = [body('status').isIn(['active', 'recovered', 'closed']).withMessage('Status must be active, recovered, or closed')]
export const idValidator = [param('id').isMongoId().withMessage('Invalid item ID')]

export const itemQueryValidators = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Search text cannot exceed 100 characters'),
  query('type').optional().isIn(ITEM_TYPES).withMessage('Invalid item type'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('location').optional().isIn(LOCATIONS).withMessage('Invalid location'),
  query('status').optional().isIn(ITEM_STATUSES.filter((status) => status !== 'closed')).withMessage('Invalid public item status'),
  query('dateRange').optional().isIn(['7d', '30d']).withMessage('dateRange must be 7d or 30d'),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).bail().custom((value) => Boolean(parseItemDate(value))).withMessage('date must be a valid YYYY-MM-DD date'),
  query('sort').optional().isIn(['newest', 'oldest']).withMessage('sort must be newest or oldest'),
  query('page').optional().matches(/^\d+$/).withMessage('page must be a positive integer'),
  query('limit').optional().matches(/^\d+$/).withMessage('limit must be a positive integer'),
]

export const adminItemQueryValidators = [
  query('q').optional().trim().isLength({ max: 100 }).withMessage('Search text cannot exceed 100 characters'),
  query('type').optional().isIn(ITEM_TYPES).withMessage('Invalid item type'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  query('location').optional().isIn(LOCATIONS).withMessage('Invalid location'),
  query('status').optional().isIn(ITEM_STATUSES).withMessage('Invalid item status'),
  query('sort').optional().isIn(['newest', 'oldest']).withMessage('sort must be newest or oldest'),
  query('page').optional().matches(/^\d+$/).withMessage('page must be a positive integer'),
  query('limit').optional().matches(/^\d+$/).withMessage('limit must be a positive integer'),
]
