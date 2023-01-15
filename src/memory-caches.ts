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
  private readonly _cache = new Map<string, Response>();

  async match(request: Request): Promise<Response | undefined> {
    const requestKey = await getRequestKey(request);
    return this._cache.get(requestKey);
  }

  async put(request: Request, response: Response): Promise<void> {
    const requestKey = await getRequestKey(request);
    this._cache.set(requestKey, response);
  }
}

(function (global: any) {
  if (global.caches == null) {
    global.caches = new MemoryCacheStorage() as any;
  } else if (global.isSecureContext == null || global.isSecureContext === false) {
    console.warn('Non-secure context. Memory cache will be used instead of Cache API');
    global.caches = new MemoryCacheStorage() as any;
  }
}.call(
  this,
  typeof global !== 'undefined'
    ? global
    : typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
    ? window
    : {}
));