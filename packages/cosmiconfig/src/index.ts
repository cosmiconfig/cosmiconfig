import {
  createPublicExplorer,
  createPublicExplorerSync,
} from '@cosmiconfig/base';
import { loadJson } from '@cosmiconfig/better-json-loader';
import { loadJs, loadJsSync } from '@cosmiconfig/js-loader';
import {
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
} from '@cosmiconfig/types';
import { loadTs, loadTsSync } from '@cosmiconfig/typescript-loader';
import { loadYaml } from '@cosmiconfig/yaml-loader';

// reexport types
export {
  CommonOptions,
  Config,
  CosmiconfigResult,
  Loader,
  LoaderResult,
  LoaderSync,
  Loaders,
  LoadersSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerBase,
  PublicExplorerSync,
  SearchStrategy,
  Transform,
  TransformSync,
} from '@cosmiconfig/types';

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
  ];
}

const defaultGlobalConfigSearchPlaces = [
  'config',
  'config.json',
  'config.yaml',
  'config.yml',
  'config.js',
  'config.ts',
  'config.cjs',
  'config.mjs',
];
const defaultGlobalConfigSearchPlacesSync = [
  'config',
  'config.json',
  'config.yaml',
  'config.yml',
  'config.js',
  'config.ts',
  'config.cjs',
];

export {
  defaultGlobalConfigSearchPlaces as globalConfigSearchPlaces,
  defaultGlobalConfigSearchPlacesSync as globalConfigSearchPlacesSync,
};

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
const defaultMetaSearchPlaces = [
  'package.json',
  'package.yaml',
  '.config/config.json',
  '.config/config.yaml',
  '.config/config.yml',
  '.config/config.js',
  '.config/config.ts',
  '.config/config.cjs',
  '.config/config.mjs',
];

const defaultMetaSearchPlacesSync = [
  'package.json',
  'package.yaml',
  '.config/config.json',
  '.config/config.yaml',
  '.config/config.yml',
  '.config/config.js',
  '.config/config.ts',
  '.config/config.cjs',
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

export function cosmiconfig(
  moduleName: string,
  options: Readonly<Partial<Options>> = {},
): PublicExplorer {
  return createPublicExplorer(moduleName, options, {
    globalConfigSearchPlaces: defaultGlobalConfigSearchPlaces,
    metaSearchPlaces: defaultMetaSearchPlaces,
    loaders: defaultLoaders,
    searchPlaces: getDefaultSearchPlaces(moduleName),
  });
}

export function cosmiconfigSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>> = {},
): PublicExplorerSync {
  return createPublicExplorerSync(moduleName, options, {
    globalConfigSearchPlaces: defaultGlobalConfigSearchPlacesSync,
    metaSearchPlaces: defaultMetaSearchPlacesSync,
    loaders: defaultLoadersSync,
    searchPlaces: getDefaultSearchPlacesSync(moduleName),
  });
}
