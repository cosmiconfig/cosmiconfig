import { loadJs, loadJson, loadJsSync, loadYaml } from './loaders';

export function getDefaultSearchPlaces(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `.${moduleName}rc.mjs`,
    `.${moduleName}rc.cts`,
    `.${moduleName}rc.mts`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.yaml`,
    `.config/${moduleName}rc.yml`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.ts`,
    `.config/${moduleName}rc.cjs`,
    `.config/${moduleName}rc.mjs`,
    `.config/${moduleName}rc.cts`,
    `.config/${moduleName}rc.mts`,
    `${moduleName}.config.js`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.mjs`,
    `${moduleName}.config.cts`,
    `${moduleName}.config.mts`,
  ];
}

export function getDefaultSearchPlacesSync(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `.${moduleName}rc.cts`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
    `.config/${moduleName}rc.yaml`,
    `.config/${moduleName}rc.yml`,
    `.config/${moduleName}rc.js`,
    `.config/${moduleName}rc.ts`,
    `.config/${moduleName}rc.cjs`,
    `.config/${moduleName}rc.cts`,
    `${moduleName}.config.js`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.cjs`,
    `${moduleName}.config.cts`,
  ];
}

export const globalConfigSearchPlaces = [
  'config',
  'config.json',
  'config.yaml',
  'config.yml',
  'config.js',
  'config.ts',
  'config.cjs',
  'config.mjs',
  'config.cts',
  'config.mts',
];
export const globalConfigSearchPlacesSync = [
  'config',
  'config.json',
  'config.yaml',
  'config.yml',
  'config.js',
  'config.ts',
  'config.cjs',
  'config.cts',
];

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const metaSearchPlaces = [
  'package.json',
  'package.yaml',
  '.config/config.json',
  '.config/config.yaml',
  '.config/config.yml',
  '.config/config.js',
  '.config/config.ts',
  '.config/config.cjs',
  '.config/config.mjs',
  '.config/config.cts',
  '.config/config.mts',
];

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.mjs': loadJs,
  '.cjs': loadJs,
  '.js': loadJs,
  '.ts': loadJs,
  '.cts': loadJs,
  '.mts': loadJs,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);

export const defaultLoadersSync = Object.freeze({
  '.cjs': loadJsSync,
  '.js': loadJsSync,
  '.cts': loadJsSync,
  '.ts': loadJsSync,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);
