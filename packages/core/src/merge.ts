/* eslint-disable @typescript-eslint/unbound-method */
export const hasOwn = Function.prototype.call.bind(
  Object.prototype.hasOwnProperty,
);
const objToString = Function.prototype.call.bind(Object.prototype.toString);

/* eslint-enable @typescript-eslint/unbound-method */

function isPlainObject(obj: unknown): boolean {
  return objToString(obj) === '[object Object]';
}

export interface MergeOptions {
  mergeArrays: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function merge(target: any, source: any, options: MergeOptions): any {
  for (const key of Object.keys(source)) {
    const newValue = source[key];
    if (hasOwn(target, key)) {
      if (Array.isArray(target[key]) && Array.isArray(newValue)) {
        if (options.mergeArrays) {
          target[key].push(...newValue);
          continue;
        }
      } else if (isPlainObject(target[key]) && isPlainObject(newValue)) {
        target[key] = merge(target[key], newValue, options);
        continue;
      }
    }
    target[key] = newValue;
  }

  return target;
}

/**
 * Merges multiple objects. Doesn't care about cloning non-primitives, as we load all these objects fresh from a file.
 */
export function mergeAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: ReadonlyArray<any>,
  options: MergeOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return objects.reduce((target, source) => merge(target, source, options), {});
}
