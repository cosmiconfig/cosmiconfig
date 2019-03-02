// @flow
'use strict';

function cacheWrapper<T>(cache: Map<string, T> | null, key: string, fn: () => T): T {
  if (!cache) {
    return fn();
  }

  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = fn();
  cache.set(key, result);
  return result;
}

export = cacheWrapper;
