import { loadJson } from './loaders';

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
export const metaSearchPlaces = ['package.json', '.config/config.json'];

// do not allow mutation of default loaders. Make sure it is set inside options
export const defaultLoaders = Object.freeze({
  '.json': loadJson,
  noExt: loadJson,
} as const);

export const defaultLoadersSync = Object.freeze({
  '.json': loadJson,
  noExt: loadJson,
} as const);
