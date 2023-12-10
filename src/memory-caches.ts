import { getRequestKey } from './getRequestKey';

const cacheStorage = new Map<string, MemoryCache>();

class MemoryCacheStorage {
  open(cacheName: string): MemoryCache {
    let cache = cacheStorage.get(cacheName);

    if (cache == null) {
      cache = new MemoryCache();
      cacheStorage.set(cacheName, cache);
    }

    return cache;
  }
}

class MemoryCache {
  private readonly _cache = new Map<string, [Request, Response]>();

  async match(request: Request): Promise<Response | undefined> {
    const requestKey = getRequestKey(request);
    const cacheItem = this._cache.get(requestKey);

    return cacheItem != null ? cacheItem[1] : undefined;
  }

  async put(request: Request, response: Response): Promise<void> {
    const requestKey = getRequestKey(request);
    this._cache.set(requestKey, [request, response]);
  }

  async keys(): Promise<Request[]> {
    const result = [];
    for (const cacheItem of this._cache.values()) {
      result.push(cacheItem[0]);
    }

    return await Promise.resolve(result);
  }

  async delete(request: Request): Promise<boolean> {
    const requestKey = getRequestKey(request);
    return this._cache.delete(requestKey);
  }
}

(function (global: any) {
  if (global.isSecureContext === false) {
    console.warn('Non-secure context. Memory cache will be used instead of Cache API');
  }

  if (global.caches == null) {
    global.caches = new MemoryCacheStorage() as any;
  }
}.call(
  globalThis,
  typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
    ? window
    : {}
));
