import { loadJs, loadJson, loadJsSync } from './loaders';

export function getDefaultSearchPlaces(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.cjs`,
    `.${moduleName}rc.mjs`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.cjs`,
    `.config/${moduleName}rc.mjs`,
    `${moduleName}.config.js`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.mjs`,
  ];
}

export function getDefaultSearchPlacesSync(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.cjs`,
    `${moduleName}.config.js`,
    `${moduleName}.config.cjs`,
  ];
}

export const defaultGlobalConfigSearchPlaces = [
  'config',
  'config.json',
  'config.js',
  'config.cjs',
  'config.mjs',
];
export const defaultGlobalConfigSearchPlacesSync = [
  'config',
  'config.json',
  'config.js',
  'config.cjs',
];

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const metaSearchPlaces = [
  'package.json',
  '.config/config.json',
  '.config/config.js',
  '.config/config.cjs',
  '.config/config.mjs',
];

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.mjs': loadJs,
  '.cjs': loadJs,
  '.js': loadJs,
  '.json': loadJson,
  noExt: loadJson,
} as const);

export const defaultLoadersSync = Object.freeze({
  '.cjs': loadJsSync,
  '.js': loadJsSync,
  '.json': loadJson,
  noExt: loadJson,
} as const);
