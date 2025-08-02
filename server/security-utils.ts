import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Enhanced input sanitization for all user inputs
export const sanitizeUserInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
          case "\0": return "";
          case "\x08": return "";
          case "\x09": return " ";
          case "\x1a": return "";
          case "\n": return " ";
          case "\r": return " ";
          case "\"": return "&quot;";
          case "'": return "&#x27;";
          case "\\": return "&#x5C;";
          case "%": return "&#x25;";
          default: return char;
        }
      })
      .trim()
      .substring(0, 1000); // Limit length to prevent DoS
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeUserInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeUserInput(key)] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Comprehensive input validation middleware
export const validateAndSanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all request data
  if (req.body) {
    req.body = sanitizeUserInput(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeUserInput(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeUserInput(req.params);
  }
  
  // Additional security checks
  const userAgent = req.get('User-Agent') || '';
  
  // Block suspicious user agents
  const suspiciousPatterns = [
    /sqlmap/i, /nmap/i, /nikto/i, /burp/i, /dirbuster/i,
    /acunetix/i, /nessus/i, /w3af/i, /havij/i, /bsqlbf/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // Check for common attack patterns in all input
  const checkForAttacks = (value: string): boolean => {
    const attackPatterns = [
      /<script/i, /javascript:/i, /onerror/i, /onload/i,
      /union.*select/i, /drop.*table/i, /insert.*into/i,
      /exec.*\(/i, /eval\(/i, /document\.cookie/i,
      /window\.location/i, /alert\(/i
    ];
    
    return attackPatterns.some(pattern => pattern.test(value));
  };
  
  // Recursively check all string values
  const checkValue = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkForAttacks(obj);
    }
    if (Array.isArray(obj)) {
      return obj.some(checkValue);
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkValue);
    }
    return false;
  };
  
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

// Content-Type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');
    
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
      }
    }
    
    next();
  };
};

// Generate secure random tokens
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Timing attack prevention for string comparison
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// IP whitelisting for admin endpoints
const ADMIN_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  if (ADMIN_WHITELIST.length === 0) {
    return next(); // Skip if no whitelist configured
  }
  
  const clientIP = req.ip || req.socket.remoteAddress || '';
  
  if (!ADMIN_WHITELIST.includes(clientIP)) {
    return res.status(403).json({ error: 'Access denied from this IP address' });
  }
  
  next();
};

// Request fingerprinting for fraud detection
export const generateRequestFingerprint = (req: Request): string => {
  const components = [
    req.ip || '',
    req.get('User-Agent') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || ''
  ];
  
  return crypto.createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};