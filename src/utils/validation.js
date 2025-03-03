import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// TOTP token schema (6-digit number)
export const totpSchema = z
  .string()
  .trim()
  .length(6)
  .regex(/^\d+$/, 'TOTP token must be a 6-digit number');

// Backup code schema (alphanumeric string)
export const backupCodeSchema = z
  .string()
  .trim()
  .min(8)
  .max(32)
  .regex(/^[a-zA-Z0-9-]+$/, 'Backup code must only contain alphanumeric characters and dashes');

/**
 * Sanitizes an input string by removing HTML tags and trimming whitespace
 * @param {string} input - The input to sanitize
 * @returns {string} - The sanitized input
 */
export function sanitizeInput(input) {
  if (input === null || input === undefined) {
    return '';
  }
  
  return sanitizeHtml(String(input), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Validates and sanitizes input against a Zod schema
 * @param {any} input - The input to validate
 * @param {z.ZodType} schema - The Zod schema to validate against
 * @returns {{ success: boolean, data?: any, error?: string }} - The validation result
 */
export function validateAndSanitize(input, schema) {
  const sanitized = sanitizeInput(input);
  
  try {
    const validated = schema.parse(sanitized);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
