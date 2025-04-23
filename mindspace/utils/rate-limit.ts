import type { NextApiResponse } from 'next';
import { LRUCache } from 'lru-cache';

type Options = {
  interval: number;
  limit: number;
  uniqueTokenPerInterval: number;
};

/**
 * Rate limiting utility to prevent abuse of API endpoints
 * Based on Next.js examples for API rate limiting
 * @param options Configuration options for the rate limiter
 * @returns A rate limiter instance
 */
export function rateLimit(options: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    /**
     * Check if the request exceeds the rate limit
     * @param res The Next.js response object
     * @param limit Optional override for the limit
     * @param token The token to identify the requester (usually IP)
     */
    check: (res: NextApiResponse, limit?: number, token?: string): Promise<void> => {
      const tokenKey = token || 'anonymous';
      const uniqueToken = `${tokenKey}`;
      const tokenCount = tokenCache.get(uniqueToken) || [0];
      
      if (tokenCount[0] === 0) {
        tokenCache.set(uniqueToken, tokenCount);
      }
      
      tokenCount[0] += 1;
      
      const currentLimit = limit || options.limit;
      
      // Set rate limit headers for monitoring
      res.setHeader('X-RateLimit-Limit', currentLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, currentLimit - tokenCount[0]));
      
      // If the token count exceeds the limit, return a rate limit error
      if (tokenCount[0] > currentLimit) {
        res.setHeader('Retry-After', Math.floor(options.interval / 1000));
        
        return Promise.reject({
          status: 429,
          message: 'Too Many Requests',
        });
      }
      
      return Promise.resolve();
    },
  };
} 