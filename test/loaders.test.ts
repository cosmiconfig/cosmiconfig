import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import { cosmiconfig, cosmiconfigSync } from '../src';
import { TempDir } from './util';

const temp = new TempDir();

beforeEach(() => {
  temp.clean();
});

afterAll(() => {
  temp.deleteTempDir();
});

describe('TypeScript loader bundler safety', () => {
  // The `typescript` package is an optional peer dependency (~5MB). It must not
  // be referenced as a static `require('typescript')` / `import('typescript')`
  // string literal, otherwise bundlers such as Vite/Rollup statically trace it
  // and pull it into consumer bundles even when the `.ts` loader is unused.
  // See https://github.com/cosmiconfig/cosmiconfig/issues/358.
  test('does not reference `typescript` with a static literal specifier', () => {
    const loadersSource = readFileSync(
      path.resolve(fileURLToPath(import.meta.url), '../../src/loaders.ts'),
      'utf8',
    );

    // `require('typescript')` and a runtime `import('typescript')` are statically
    // analyzable by bundlers. A `typeof import('typescript')` type annotation is
    // erased at compile time, so it is excluded here via the negative lookbehind.
    expect(loadersSource).not.toMatch(/require\(\s*['"]typescript['"]\s*\)/);
    expect(loadersSource).not.toMatch(
      /(?<!typeof\s)import\(\s*['"]typescript['"]\s*\)/,
    );
  });
});

describe('TypeScript loader still works when used explicitly', () => {
  beforeEach(() => {
    temp.createFile('foo.ts', 'export default { foo: true } as any;');
  });

  const file = temp.absolutePath('foo.ts');
  const checkResult = (result: any) => {
    expect(result.config).toEqual({ foo: true });
    expect(result.filepath).toBe(file);
  };

  test('async', async () => {
    const result = await cosmiconfig('loaders-tests').load(file);
    checkResult(result);
  }, 20000);

  test('sync', () => {
    const result = cosmiconfigSync('loaders-tests').load(file);
    checkResult(result);
  });
});
