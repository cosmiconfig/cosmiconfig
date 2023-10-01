/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export * from './types.js';

import os from 'os';
import { Explorer } from './Explorer.js';
import { ExplorerSync } from './ExplorerSync.js';
import {
  loadJs,
  loadJson,
  loadJsSync,
  loadTs,
  loadTsSync,
  loadYaml,
} from './loaders.js';
import {
  InternalOptions,
  InternalOptionsSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
  TransformSync,
} from './types.js';
import { removeUndefinedValuesFromObject } from './util';

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const metaSearchPlaces = [
  'package.json',
  '.config.json',
  '.config.yaml',
  '.config.yml',
  '.config.js',
  '.config.ts',
  '.config.cjs',
  '.config.mjs',
];

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.mjs': loadJs,
  '.cjs': loadJs,
  '.js': loadJs,
  '.ts': loadTs,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);
export const defaultLoadersSync = Object.freeze({
  '.cjs': loadJsSync,
  '.js': loadJsSync,
  '.ts': loadTsSync,
  '.json': loadJson,
  '.yaml': loadYaml,
  '.yml': loadYaml,
  noExt: loadYaml,
} as const);

const identity: TransformSync = function identity(x) {
  return x;
};

function getInternalOptions<T extends Options | OptionsSync>(
  moduleName: string,
  options: Readonly<T>,
): T {
  const metaExplorer = new ExplorerSync({
    packageProp: 'cosmiconfig',
    stopDir: process.cwd(),
    searchPlaces: metaSearchPlaces,
    ignoreEmptySearchPlaces: false,
    applyPackagePropertyPathToConfiguration: true,
    loaders: defaultLoaders,
    transform: identity,
    cache: true,
    metaConfigFilePath: null,
    mergeImportArrays: true,
  });
  const metaConfig = metaExplorer.search();

  if (!metaConfig) {
    return options;
  }

  if (metaConfig.config?.loaders) {
    throw new Error('Can not specify loaders in meta config file');
  }

  const overrideOptions = metaConfig.config ?? {};

  if (overrideOptions.searchPlaces) {
    overrideOptions.searchPlaces = overrideOptions.searchPlaces.map(
      (path: string) => path.replace('{name}', moduleName),
    );
  }

  overrideOptions.metaConfigFilePath = metaConfig.filepath;

  return { ...options, ...removeUndefinedValuesFromObject(overrideOptions) };
}

function normalizeOptions(
  moduleName: string,
  options: Readonly<Options>,
): InternalOptions {
  const defaults = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.ts`,
      `.${moduleName}rc.cjs`,
      `.${moduleName}rc.mjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.json`,
      `.config/${moduleName}rc.yaml`,
      `.config/${moduleName}rc.yml`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.ts`,
      `.config/${moduleName}rc.cjs`,
      `.config/${moduleName}rc.mjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.ts`,
      `${moduleName}.config.cjs`,
      `${moduleName}.config.mjs`,
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoaders,
    metaConfigFilePath: null,
    mergeImportArrays: true,
  } satisfies InternalOptions;

  return {
    ...defaults,
    ...removeUndefinedValuesFromObject(options),
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };
}

function normalizeOptionsSync(
  moduleName: string,
  options: Readonly<OptionsSync>,
): InternalOptionsSync {
  const defaults = {
    packageProp: moduleName,
    searchPlaces: [
      'package.json',
      `.${moduleName}rc`,
      `.${moduleName}rc.json`,
      `.${moduleName}rc.yaml`,
      `.${moduleName}rc.yml`,
      `.${moduleName}rc.js`,
      `.${moduleName}rc.ts`,
      `.${moduleName}rc.cjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.json`,
      `.config/${moduleName}rc.yaml`,
      `.config/${moduleName}rc.yml`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.ts`,
      `.config/${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.ts`,
      `${moduleName}.config.cjs`,
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: os.homedir(),
    cache: true,
    transform: identity,
    loaders: defaultLoadersSync,
    metaConfigFilePath: null,
    mergeImportArrays: true,
  } satisfies InternalOptionsSync;

  return {
    ...defaults,
    ...removeUndefinedValuesFromObject(options),
    loaders: {
      ...defaults.loaders,
      ...options.loaders,
    },
  };
}

export function cosmiconfig(
  moduleName: string,
  options: Readonly<Options> = {},
): PublicExplorer {
  const internalOptions = getInternalOptions(moduleName, options);
  const normalizedOptions = normalizeOptions(moduleName, internalOptions);
  const explorer = new Explorer(normalizedOptions);
  return {
    search: explorer.search.bind(explorer),
    load: explorer.load.bind(explorer),
    clearLoadCache: explorer.clearLoadCache.bind(explorer),
    clearSearchCache: explorer.clearSearchCache.bind(explorer),
    clearCaches: explorer.clearCaches.bind(explorer),
  };
}

export function cosmiconfigSync(
  moduleName: string,
  options: Readonly<OptionsSync> = {},
): PublicExplorerSync {
  const internalOptions = getInternalOptions(moduleName, options);
  const normalizedOptions = normalizeOptionsSync(moduleName, internalOptions);
  const explorerSync = new ExplorerSync(normalizedOptions);
  return {
    search: explorerSync.search.bind(explorerSync),
    load: explorerSync.load.bind(explorerSync),
    clearLoadCache: explorerSync.clearLoadCache.bind(explorerSync),
    clearSearchCache: explorerSync.clearSearchCache.bind(explorerSync),
    clearCaches: explorerSync.clearCaches.bind(explorerSync),
  };
}
