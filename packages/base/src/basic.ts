import type {
  LoaderSync,
  Options,
  OptionsSync,
  PublicExplorer,
  PublicExplorerSync,
} from '@cosmiconfig/types';
import { createPublicExplorer, createPublicExplorerSync } from './index';

export function getDefaultSearchPlaces(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
  ];
}

export function getDefaultSearchPlacesSync(moduleName: string): Array<string> {
  return [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.config/${moduleName}rc`,
    `.config/${moduleName}rc.json`,
  ];
}

export const defaultGlobalConfigSearchPlaces = ['config', 'config.json'];
export const defaultGlobalConfigSearchPlacesSync = ['config', 'config.json'];

// this needs to be hardcoded, as this is intended for end users, who can't supply options at this point
export const defaultMetaSearchPlaces = ['package.json', '.config/config.json'];

export const loadJson: LoaderSync = function loadJson(filepath, content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.json': loadJson,
  noExt: loadJson,
} as const);

export const defaultLoadersSync = Object.freeze({
  '.json': loadJson,
  noExt: loadJson,
} as const);

export function cosmiconfigBasic(
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

export function cosmiconfigBasicSync(
  moduleName: string,
  options: Readonly<Partial<OptionsSync>> = {},
): PublicExplorerSync {
  return createPublicExplorerSync(moduleName, options, {
    globalConfigSearchPlaces: defaultGlobalConfigSearchPlacesSync,
    metaSearchPlaces: defaultMetaSearchPlaces,
    loaders: defaultLoadersSync,
    searchPlaces: getDefaultSearchPlacesSync(moduleName),
  });
}
