// @flow
'use strict';

const os = require('os');
const createExplorer = require('./createExplorer');
const parser = require('./parser');

const homedir = os.homedir();

function cosmiconfig(
  moduleName: string,
  options: {
    packageProp?: string | false,
    rc?: string | false,
    js?: string | false,
    rcStrictJson?: boolean,
    rcExtensions?: boolean,
    stopDir?: string,
    cache?: boolean,
    transform?: CosmiconfigResult => CosmiconfigResult,
    configPath?: string,
  }
) {
  const x: ExplorerOptions = Object.assign(
    {},
    {
      moduleName,
      stopDir: homedir,
      cache: true,
      searchSchema: [
        `package.json`,
        `.${moduleName}rc`,
        // `.${moduleName}rc.json`,
        // `.${moduleName}rc.yaml`,
        // `.${moduleName}rc.yml`,
        // `.${moduleName}rc.js`,
        `${moduleName}.config.js`
      ]
    },
    options
  );

  return createExplorer(x);
};

cosmiconfig.loadJson = parser.parseJson;
cosmiconfig.loadJs = parser.parseJs;
cosmiconfig.loadYaml = parser.parseYaml;

module.exports = cosmiconfig;