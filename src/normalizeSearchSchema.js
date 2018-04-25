// @flow
'use strict';

const path = require('path');
const parser = require('./parser');

// Translate all schema items to objects and apply defaults,
// so we end up with a normalized schema whose structure
// we can take for granted in other functions.
function normalizeSearchSchema(
  rawSchema: Array<RawSearchSchemaItem>,
  moduleName: string
): Array<SearchSchemaItem> {
  return rawSchema.map(rawSchemaItem => {
    return normalizeSearchSchemaItem(rawSchemaItem, moduleName);
  });
}

function normalizeSearchSchemaItem(
  rawSchemaItem: RawSearchSchemaItem,
  moduleName: string
): SearchSchemaItem {
  const filename = getSchemaItemFilename(rawSchemaItem);
  const loader = getSchemaItemLoader(rawSchemaItem);
  const property = getSchemaItemProperty(rawSchemaItem, moduleName);
  return { filename, loader, property };
}

function getSchemaItemProperty(
  rawSchemaItem: RawSearchSchemaItem,
  moduleName: string
): string | null {
  const definedProperty =
    typeof rawSchemaItem !== 'string' && rawSchemaItem.property;
  if (definedProperty) {
    return definedProperty;
  }

  const filename = getSchemaItemFilename(rawSchemaItem);

  if (filename === 'package.json') {
    return moduleName;
  }

  return null;
}

function getSchemaItemFilename(rawSchemaItem: RawSearchSchemaItem): string {
  if (typeof rawSchemaItem === 'string') {
    return rawSchemaItem;
  }
  return rawSchemaItem.filename;
}

function getSchemaItemLoader(rawSchemaItem: RawSearchSchemaItem): Loader {
  const definedLoader =
    typeof rawSchemaItem !== 'string' && rawSchemaItem.loader;
  if (definedLoader) {
    return definedLoader;
  }
  const filename = getSchemaItemFilename(rawSchemaItem);
  const ext = path.extname(filename);
  if (ext === '.json') {
    return parser.parseJson;
  }
  if (ext === '.js') {
    return parser.parseJs;
  }
  if (ext === '.yaml' || ext === '.yml' || ext === '') {
    return parser.parseYaml;
  }
  throw new Error(`Cannot infer loader for ${filename}`);
}

module.exports = normalizeSearchSchema;
