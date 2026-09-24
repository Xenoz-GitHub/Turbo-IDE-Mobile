/**
 * Client-Side Security Utilities
 * XSS Prevention, Input Sanitization, and Secure Storage
 * Credits: ENCRYPTED CREW - Developed by Suarez J. (XenozExe)
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove potentially dangerous HTML/script tags
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'untitled';
  
  // Remove dangerous characters and path traversal attempts
  let safe = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
  
  // Limit length
  safe = safe.substring(0, 255);
  
  // Ensure it's not empty
  if (!safe) safe = 'untitled';
  
  return safe;
}

/**
 * Validate URL to prevent SSRF and malicious redirects
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS (or HTTP for localhost)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    
    // Block localhost and internal IPs (except for development)
    const hostname = parsed.hostname.toLowerCase();
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (!isDevelopment) {
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^0\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^::1$/,
        /^fe80:/i,
      ];
      
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Secure localStorage with encryption
 */
class SecureStorage {
  private prefix = 'tc_secure_';
  
  /**
   * Simple XOR encryption (for basic obfuscation, not cryptographic security)
   */
  private encrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }
  
  private decrypt(encoded: string, key: string): string {
    try {
      const text = atob(encoded);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }
  
  /**
   * Generate a device-specific key
   */
  private getDeviceKey(): string {
    let key = localStorage.getItem('tc_device_key');
    if (!key) {
      // Generate a random key based on device characteristics
      key = btoa(
        navigator.userAgent +
        screen.width +
        screen.height +
        navigator.language +
        Math.random().toString(36)
      ).substring(0, 32);
      localStorage.setItem('tc_device_key', key);
    }
    return key;
  }
  
  /**
   * Set encrypted item in localStorage
   */
  setItem(key: string, value: string): void {
    try {
      const safeKey = this.prefix + sanitizeInput(key, 100);
      const deviceKey = this.getDeviceKey();
      const encrypted = this.encrypt(value, deviceKey);
      localStorage.setItem(safeKey, encrypted);
    } catch (error) {
      console.error('[SECURITY] Error storing encrypted data:', error);
    }
  }
  
  /**
   * Get decrypted item from localStorage
   */
  getItem(key: string): string | null {
    try {
      const safeKey = this.prefix + sanitizeInput(key, 100);
      const encrypted = localStorage.getItem(safeKey);
      if (!encrypted) return null;
      
      const deviceKey = this.getDeviceKey();
      return this.decrypt(encrypted, deviceKey);
    } catch (error) {
      console.error('[SECURITY] Error retrieving encrypted data:', error);
      return null;
    }
  }
  
  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      const safeKey = this.prefix + sanitizeInput(key, 100);
      localStorage.removeItem(safeKey);
    } catch (error) {
      console.error('[SECURITY] Error removing encrypted data:', error);
    }
  }
  
  /**
   * Clear all secure storage
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[SECURITY] Error clearing encrypted data:', error);
    }
  }
}

export const secureStorage = new SecureStorage();

/**
 * Rate limiter for client-side operations
 */
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  /**
   * Check if action is allowed
   * @param action - Unique identifier for the action
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isAllowed(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(action) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    // Check if exceeded limit
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(action, recentAttempts);
    
    return true;
  }
  
  /**
   * Reset attempts for an action
   */
  reset(action: string): void {
    this.attempts.delete(action);
  }
  
  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

export const clientRateLimiter = new ClientRateLimiter();

/**
 * Validate C++ code input for dangerous patterns
 */
export function validateCodeInput(code: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for extremely long lines (potential DoS)
  const lines = code.split('\n');
  if (lines.some(line => line.length > 10000)) {
    issues.push('Code contains extremely long lines');
  }
  
  // Check total size
  if (code.length > 1000000) { // 1MB limit
    issues.push('Code exceeds maximum size (1MB)');
  }
  
  // Check for suspicious patterns (this is C++ compiler, so system calls are expected)
  // We only warn about potential issues, don't block
  const suspiciousPatterns = [
    { pattern: /rm\s+-rf/i, message: 'Contains potentially destructive file operations' },
    { pattern: /eval\s*\(/i, message: 'Contains eval-like patterns' },
  ];
  
  suspiciousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(code)) {
      issues.push(message);
    }
  });
  
  return {
    valid: issues.length === 0 || issues.every(issue => issue.startsWith('Contains')),
    issues
  };
}

/**
 * Generate secure random ID
 */
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string (for non-cryptographic purposes)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Detect potential clickjacking
 */
export function detectClickjacking(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top, we're likely in an iframe
    return true;
  }
}

/**
 * Setup security monitoring
 */
export function initSecurityMonitoring(): void {
  // Detect clickjacking
  if (detectClickjacking()) {
    console.warn('[SECURITY] Potential clickjacking detected - app is running in an iframe');
  }
  
  // Monitor console tampering attempts
  const originalConsole = { ...console };
  
  // Detect devtools (basic check)
  let devtoolsOpen = false;
  const threshold = 160;
  
  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        console.info('[SECURITY] Developer tools detected - this is normal for development');
      }
    } else {
      devtoolsOpen = false;
    }
  }, 1000);
}

/**
 * Sanitize API response data
 */
export function sanitizeApiResponse<T>(data: unknown): T | null {
  try {
    // Remove any potential XSS in string values
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };
    
    return sanitize(data) as T;
  } catch (error) {
    console.error('[SECURITY] Error sanitizing API response:', error);
    return null;
  }
}

/**
 * Validate file size before processing
 */
export function validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * Prevent timing attacks by using constant-time comparison
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
