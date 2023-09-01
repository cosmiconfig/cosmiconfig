/* eslint-disable @typescript-eslint/no-require-imports */

import { rmSync, writeFileSync } from 'fs';
import { rm, writeFile } from 'fs/promises';
import { pathToFileURL } from 'url';
import { Loader, LoaderSync } from './index';
import { Loaders } from './types';

let importFresh: typeof import('import-fresh');
const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  const result = importFresh(filepath);
  return result;
};

const loadJs: Loader = async function loadJs(filepath) {
  try {
    const { href } = pathToFileURL(filepath);
    return (await import(href)).default;
  } catch (error) {
    return loadJsSync(filepath, '');
  }
};

let parseJson: typeof import('parse-json');
const loadJson: LoaderSync = function loadJson(filepath, content) {
  if (parseJson === undefined) {
    parseJson = require('parse-json');
  }

  try {
    const result = parseJson(content);
    return result;
  } catch (error: any) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

let yaml: typeof import('js-yaml');
const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (yaml === undefined) {
    yaml = require('js-yaml');
  }

  try {
    const result = yaml.load(content);
    return result;
  } catch (error: any) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

let typescript: typeof import('typescript');
const loadTsSync: LoaderSync = function loadTsSync(filepath, content) {
  if (typescript === undefined) {
    typescript = require('typescript');
  }
  const compiledFilepath = `${filepath.slice(0, -2)}js`;
  try {
    content = typescript.transpileModule(content, {
      compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2021,
      },
    }).outputText;
    writeFileSync(compiledFilepath, content);
    const config = loadJsSync(compiledFilepath, content);
    return config;
  } catch (error: any) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  } finally {
    rmSync(compiledFilepath);
  }
};

const loadTs: Loader = async function loadTs(filepath, content) {
  if (typescript === undefined) {
    typescript = await import('typescript');
  }
  const compiledFilepath = `${filepath.slice(0, -2)}js`;
  try {
    content = typescript.transpileModule(content, {
      compilerOptions: {
        module: typescript.ModuleKind.NodeNext,
        target: typescript.ScriptTarget.ES2021,
      },
    }).outputText;
    await writeFile(compiledFilepath, content);
    const config = await loadJs(compiledFilepath, content);
    return config;
  } catch (error: any) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  } finally {
    await rm(compiledFilepath);
  }
};

const loaders: Loaders = {
  loadJs,
  loadJsSync,
  loadTs,
  loadTsSync,
  loadJson,
  loadYaml,
};

export { loaders };
