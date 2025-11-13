import { body } from 'express-validator';
import { isValidEmail } from '../utils/validators';

/**
 * Login Validations
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Refresh Token Validations
 */
export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

/**
 * Forgot Password Validations
 */
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
];

/**
 * Reset Password Validations
 */
export const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

/**
 * Verify Email Validations
 */
export const verifyEmailValidation = [
  body('token').trim().notEmpty().withMessage('Verification token is required'),
];

/**
 * Change Password Validations
 */
export const changePasswordValidation = [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];
