import NodeCache from 'node-cache';
import { LRUCache } from 'lru-cache';
import type { Campaign } from '../../shared/schema';

// Cache service with multiple caching strategies
export class CacheService {
  private static instance: CacheService;
  private memoryCache: NodeCache;
  private lruCache: LRUCache<string, any>;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    // Node-cache for standard TTL-based caching
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // Better performance for read-heavy workloads
    });

    // LRU cache for high-volume requests
    this.lruCache = new LRUCache({
      max: 1000, // Maximum 1000 items
      ttl: 1000 * 60 * 5, // 5 minutes TTL
    });

    // Log cache statistics periodically
    setInterval(() => {
      this.logCacheStats();
    }, 300000); // Every 5 minutes
  }

  // Cache campaigns data (10 seconds TTL for faster updates)
  getCampaigns(): Campaign[] | null {
    return this.memoryCache.get('campaigns') || null;
  }

  setCampaigns(data: Campaign[]): void {
    this.memoryCache.set('campaigns', data, 10); // 10 seconds - more responsive
  }

  // Cache analytics data (5 minutes TTL)
  getAnalytics(key: string): Record<string, unknown> | null {
    return this.memoryCache.get(`analytics:${key}`) || null;
  }

  setAnalytics(key: string, data: Record<string, unknown>): void {
    this.memoryCache.set(`analytics:${key}`, data, 300); // 5 minutes
  }

  // LRU cache for high-frequency requests
  getLRU(key: string): unknown | null {
    return this.lruCache.get(key) || null;
  }

  setLRU(key: string, data: unknown, ttl?: number): void {
    if (ttl) {
      this.lruCache.set(key, data, { ttl: ttl * 1000 });
    } else {
      this.lruCache.set(key, data);
    }
  }

  // Cache invalidation
  invalidatePattern(pattern: string): void {
    const keys = this.memoryCache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.memoryCache.del(key);
      }
    });
  }

  invalidateAll(): void {
    this.memoryCache.flushAll();
    this.lruCache.clear();
  }

  // Cache statistics
  getStats(): Record<string, unknown> {
    return {
      memoryCache: {
        keys: this.memoryCache.keys().length,
        stats: this.memoryCache.getStats()
      },
      lruCache: {
        size: this.lruCache.size,
        max: this.lruCache.max
      }
    };
  }

  // Performance tracking
  private logCacheStats(): void {
    const _stats = this.getStats();
    // Cache statistics tracked silently in production
  }

  // Warmup cache with commonly requested data
  async warmup(): Promise<void> {
    // Cache warmup in progress
    // This will be called during server startup to pre-load common data
  }
}

// Singleton instance
export const cacheService = new CacheService();
