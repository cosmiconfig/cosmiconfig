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
function cloneValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }
  if (isPlainObject(value)) {
    return merge({}, value, { mergeArrays: false });
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function merge(target: any, source: any, options: MergeOptions): any {
  for (const key of Object.keys(source)) {
    /* istanbul ignore next -- @preserve */
    if (key === '__proto__' || key === 'constructor') {
      continue;
    }

    const newValue = source[key];
    if (hasOwn(target, key)) {
      if (Array.isArray(target[key]) && Array.isArray(newValue)) {
        if (options.mergeArrays) {
          target[key].push(...cloneValue(newValue));
          continue;
        }
      } else if (isPlainObject(target[key]) && isPlainObject(newValue)) {
        target[key] = merge(target[key], newValue, options);
        continue;
      }
    }
    target[key] = cloneValue(newValue);
  }

  return target;
}

/**
 * Merges multiple objects. Clones plain objects and arrays so imported modules are not mutated.
 */
export function mergeAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: ReadonlyArray<any>,
  options: MergeOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return objects.reduce((target, source) => merge(target, source, options), {});
}
