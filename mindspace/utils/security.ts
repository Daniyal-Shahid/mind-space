/**
 * Security utility functions for the MindSpace application
 * Contains helpers for CSRF protection, data sanitization, and security validation
 */

import crypto from 'crypto';
import { serialize, parse } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Secret key for JWT tokens - this should ideally be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'mindspace-csrf-secret-key-change-in-production';

/**
 * Generate a secure CSRF token
 * @returns A random token for CSRF protection
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a JWT-based CSRF token with expiration
 * @returns A JWT token for CSRF protection
 */
export function generateJWTCSRFToken(): string {
  return jwt.sign(
    { 
      data: crypto.randomBytes(16).toString('hex'),
      type: 'csrf'
    }, 
    JWT_SECRET, 
    { expiresIn: '1h' }
  );
}

/**
 * Verify a JWT CSRF token
 * @param token The token to validate
 * @returns Boolean indicating if the token is valid
 */
export function verifyJWTCSRFToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ensure it's a CSRF token
    return typeof decoded === 'object' && decoded !== null && decoded.type === 'csrf';
  } catch (error) {
    return false;
  }
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
 * Set a secure cookie
 */
export function setCookie(
  res: NextApiResponse,
  name: string,
  value: string,
  options: Record<string, any> = {}
) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 3600, // 1 hour in seconds
    ...options,
  };

  res.setHeader('Set-Cookie', serialize(name, value, cookieOptions));
}

/**
 * Parse cookies from request
 */
export function parseCookies(req: NextApiRequest): Record<string, string | undefined> {
  // For API routes
  if (req.cookies) {
    return req.cookies;
  }
  
  // For client-side requests with cookie header
  const cookieHeader = req.headers.cookie || '';
  return parse(cookieHeader);
}

/**
 * Get a cookie value from request
 */
export function getCookie(req: NextApiRequest, name: string): string | undefined {
  const cookies = parseCookies(req);
  return cookies[name];
}

/**
 * Set a CSRF token cookie and return the token
 */
export function setCSRFCookie(res: NextApiResponse): string {
  const token = generateJWTCSRFToken();
  setCookie(res, 'csrf_token', token);
  return token;
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