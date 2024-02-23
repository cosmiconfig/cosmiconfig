/* eslint-disable @typescript-eslint/no-require-imports */

import { Loader, LoaderSync, loadJs } from '@cosmiconfig/core';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { rm, writeFile } from 'fs/promises';
import path from 'path';

let importFresh: typeof import('import-fresh');
export const loadJsSync: LoaderSync = function loadJsSync(filepath) {
  if (importFresh === undefined) {
    importFresh = require('import-fresh');
  }

  return importFresh(filepath);
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
  /* istanbul ignore next -- @preserve */
  if (typescript === undefined) {
    typescript = require('typescript');
  }
  const compiledFilepath = `${filepath.slice(0, -2)}cjs`;
  try {
    const config = resolveTsConfig(path.dirname(filepath)) ?? {};
    config.compilerOptions = {
      ...config.compilerOptions,
      module: typescript.ModuleKind.NodeNext,
      moduleResolution: typescript.ModuleResolutionKind.NodeNext,
      target: typescript.ScriptTarget.ES2022,
      noEmit: false,
    };
    content = typescript.transpileModule(content, config).outputText;
    writeFileSync(compiledFilepath, content);
    return loadJsSync(compiledFilepath, content).default;
  } catch (error) {
    error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
    throw error;
  } finally {
    if (existsSync(compiledFilepath)) {
      rmSync(compiledFilepath);
    }
  }
};

export const loadTs: Loader = async function loadTs(filepath, content) {
  if (typescript === undefined) {
    typescript = (await import('typescript')).default;
  }
  const compiledFilepath = `${filepath.slice(0, -2)}mjs`;
  let transpiledContent;
  try {
    try {
      const config = resolveTsConfig(path.dirname(filepath)) ?? {};
      config.compilerOptions = {
        ...config.compilerOptions,
        module: typescript.ModuleKind.ES2022,
        moduleResolution: typescript.ModuleResolutionKind.Bundler,
        target: typescript.ScriptTarget.ES2022,
        noEmit: false,
      };
      transpiledContent = typescript.transpileModule(
        content,
        config,
      ).outputText;
      await writeFile(compiledFilepath, transpiledContent);
    } catch (error) {
      error.message = `TypeScript Error in ${filepath}:\n${error.message}`;
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/return-await
    return await loadJs(compiledFilepath, transpiledContent);
  } finally {
    if (existsSync(compiledFilepath)) {
      await rm(compiledFilepath);
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveTsConfig(directory: string): any {
  const filePath = typescript.findConfigFile(directory, (fileName) => {
    return typescript.sys.fileExists(fileName);
  });
  if (filePath !== undefined) {
    const { config, error } = typescript.readConfigFile(filePath, (path) =>
      typescript.sys.readFile(path),
    );
    if (error) {
      throw new Error(`Error in ${filePath}: ${error.messageText.toString()}`);
    }
    return config;
  }
  return;
}
