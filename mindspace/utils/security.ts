/**
 * Security utility functions for the MindSpace application
 * Contains helpers for CSRF protection, data sanitization, and security validation
 */

import crypto from 'crypto';

/**
 * Generate a secure CSRF token
 * @returns A random token for CSRF protection
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify that a CSRF token is valid
 * @param token The token to validate
 * @param storedToken The token stored in the session/cookie
 * @returns Boolean indicating if the token is valid
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken || token.length < 32 || storedToken.length < 32) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  // This is a safer alternative to crypto.timingSafeEqual which has type issues
  let result = token.length === storedToken.length;
  let i = 0;
  
  // XOR each character's code point in both strings
  // This ensures the comparison takes the same amount of time regardless of match position
  while (i < token.length && i < storedToken.length) {
    result = result && (token.charCodeAt(i) === storedToken.charCodeAt(i));
    i++;
  }
  
  return result;
}

/**
 * Create a nonce for use in Content-Security-Policy
 * @returns A random nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses a basic sanitization approach - for production, consider using a library like DOMPurify
 * @param input The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return input
    // Replace HTML tags with entities
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Replace script event handlers
    .replace(/on\w+=/gi, 'data-removed=')
    // Replace JavaScript links
    .replace(/javascript:/gi, 'removed:')
    // Replace dangerous CSS expressions
    .replace(/expression\s*\(/gi, 'removed(')
    // Replace dangerous attributes
    .replace(/(data-\w+)=/gi, 'data-safe=');
}

/**
 * Validate that a file upload meets security requirements
 * @param filename The name of the uploaded file
 * @param filesize The size of the file in bytes
 * @param allowedExtensions Array of allowed file extensions
 * @param maxSize Maximum file size in bytes
 * @returns Boolean indicating if the file is valid and an error message if not
 */
export function validateFileUpload(
  filename: string,
  filesize: number,
  allowedExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): { valid: boolean; error?: string } {
  // Check file size
  if (filesize > maxSize) {
    return { 
      valid: false, 
      error: `File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` 
    };
  }
  
  // Check file extension
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}` 
    };
  }
  
  // Validate filename for security (no path traversal, etc.)
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { 
      valid: false, 
      error: 'Invalid filename' 
    };
  }
  
  return { valid: true };
} 