import { body } from 'express-validator'

export const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').isLength({ max: 100 }).customSanitizer((value) => value.toLowerCase()),
  body('studentId').trim().matches(/^[A-Za-z0-9_-]{3,20}$/).withMessage('Student ID must be 3 to 20 letters, numbers, underscores or hyphens'),
  body('password').isString().custom((value) => Buffer.byteLength(value, 'utf8') >= 8 && Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password must be 8 to 72 bytes'),
]

export const loginValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').isLength({ max: 100 }).customSanitizer((value) => value.toLowerCase()),
  body('password').isString().notEmpty().withMessage('Password is required'),
]
