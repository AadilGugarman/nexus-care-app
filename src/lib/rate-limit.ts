// Rate Limiting Utility
// Simple in-memory rate limiter for API routes and sensitive operations

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.cache = new Map();
    this.config = config;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @returns true if rate limit exceeded, false otherwise
   */
  check(identifier: string): { limited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.cache.get(identifier);

    // No previous entry or expired - allow request
    if (!entry || entry.resetTime <= now) {
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
      });
      
      return {
        limited: false,
        remaining: this.config.uniqueTokenPerInterval - 1,
        resetTime: now + this.config.interval,
      };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.uniqueTokenPerInterval) {
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    return {
      limited: false,
      remaining: this.config.uniqueTokenPerInterval - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.cache.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.resetTime <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5,
});

/**
 * Standard rate limiter for API routes
 * 100 requests per minute
 */
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

/**
 * Aggressive rate limiter for sensitive operations
 * 10 requests per 5 minutes
 */
export const sensitiveRateLimiter = new RateLimiter({
  interval: 5 * 60 * 1000, // 5 minutes
  uniqueTokenPerInterval: 10,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client identifier from request
 * Uses IP address or user agent as fallback
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  // Fallback to user agent if no IP
  if (ip === 'unknown') {
    return request.headers.get('user-agent') || 'anonymous';
  }
  
  return ip;
}

/**
 * Apply rate limiting to a request
 * Returns error response if rate limited
 */
export function applyRateLimit(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter
): Response | null {
  const { limited, remaining, resetTime } = limiter.check(identifier);

  if (limited) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limiter['config'].uniqueTokenPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  return null; // No rate limit
}

/**
 * Client-side rate limiter (for UI)
 * Prevents excessive button clicks or form submissions
 */
export class ClientRateLimiter {
  private lastCall: number = 0;
  private interval: number;

  constructor(intervalMs: number = 1000) {
    this.interval = intervalMs;
  }

  /**
   * Check if action should be throttled
   * @returns true if allowed, false if should wait
   */
  check(): boolean {
    const now = Date.now();
    if (now - this.lastCall < this.interval) {
      return false;
    }
    this.lastCall = now;
    return true;
  }

  /**
   * Get remaining wait time in milliseconds
   */
  remainingWait(): number {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    return Math.max(0, this.interval - elapsed);
  }
}

/**
 * Debounce utility for search and input handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle utility for scroll and resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
