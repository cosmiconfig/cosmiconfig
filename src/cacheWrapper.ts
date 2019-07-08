import { Cache, CosmiconfigResult } from './types';

async function cacheWrapper(
  cache: Cache,
  key: string,
  fn: () => Promise<CosmiconfigResult>,
): Promise<CosmiconfigResult> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fn();
  cache.set(key, result);
  return result;
}

function cacheWrapperSync(
  cache: Cache,
  key: string,
  fn: () => CosmiconfigResult,
): CosmiconfigResult {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = fn();
  cache.set(key, result);
  return result;
}

export { cacheWrapper, cacheWrapperSync };
