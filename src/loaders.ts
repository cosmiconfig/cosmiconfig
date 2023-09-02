/* eslint-disable @typescript-eslint/no-require-imports */

import { rmSync, writeFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Loader, LoaderSync } from './index';

let importFresh: typeof import('import-fresh');
export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  return importFresh(filepath);
};

export const loadJs: Loader = async function loadJs(filepath) {
  try {
    const { href } = pathToFileURL(filepath);
    return (await import(href)).default;
  } catch (error) {
    return loadJsSync(filepath, '');
  }
};

let parseJson: typeof import('parse-json');
export const loadJson: LoaderSync = function loadJson(filepath, content) {
  if (parseJson === undefined) {
    parseJson = require('parse-json');
  }

  try {
    return parseJson(content);
  } catch (error) {
    error.message = `JSON Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

let yaml: typeof import('js-yaml');
export const loadYaml: LoaderSync = function loadYaml(filepath, content) {
  if (yaml === undefined) {
    yaml = require('js-yaml');
  }

  try {
    return yaml.load(content);
  } catch (error) {
    error.message = `YAML Error in ${filepath}:\n${error.message}`;
    throw error;
  }
};

let typescript: typeof import('typescript');
export const loadTsSync: LoaderSync = function loadTsSync(filepath, content) {
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
    return loadJsSync(compiledFilepath, content);
  } catch (error) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  } finally {
    rmSync(compiledFilepath);
  }
};

export const loadTs: Loader = async function loadTs(filepath, content) {
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
    // eslint-disable-next-line @typescript-eslint/return-await
    return await loadJs(compiledFilepath, content);
  } catch (error) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  } finally {
    await rm(compiledFilepath);
  }
};
