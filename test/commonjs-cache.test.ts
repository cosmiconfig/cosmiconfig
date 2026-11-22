import { execFileSync } from 'child_process';
import path from 'path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TempDir } from './util';

const temp = new TempDir();
let cosmiconfig: typeof import('../src').cosmiconfig;

beforeAll(() => {
  // Loading the built API keeps Node's module cache outside Vitest's transforms.
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc')]);
  ({ cosmiconfig } = require('../dist'));
}, 20000);

afterAll(() => {
  temp.deleteTempDir();
});

describe.each(['cjs', 'cts'])(
  'CommonJS .%s configuration caching',
  (extension) => {
    test.each(['load', 'search'] as const)(
      'reloads changed files using %s without disabling explorer caches',
      async (method) => {
        const directory = `${extension}-${method}`;
        temp.createFile(`${directory}/package.json`, '{ "type": "module" }');
        const filename = `foo.config.${extension}`;
        const filepath = temp.absolutePath(`${directory}/${filename}`);
        const options = { searchPlaces: [filename] };
        const load = async (explorer: ReturnType<typeof cosmiconfig>) =>
          await explorer[method](
            method === 'load' ? filepath : path.dirname(filepath),
          );
        const write = (count: number) => {
          const assertion = extension === 'cts' ? ' as const' : '';
          temp.createFile(
            `${directory}/${filename}`,
            `module.exports = { count: ${count} }${assertion};`,
          );
        };

        const explorer = cosmiconfig('foo', options);
        write(1);
        const initial = await load(explorer);
        write(2);
        const cached = await load(explorer);
        const fresh = await load(cosmiconfig('foo', options));
        explorer.clearCaches();
        const cleared = await load(explorer);
        const uncachedExplorer = cosmiconfig('foo', {
          ...options,
          cache: false,
        });
        const uncachedInitial = await load(uncachedExplorer);
        write(3);
        const uncachedUpdated = await load(uncachedExplorer);

        expect(
          [
            initial,
            cached,
            fresh,
            cleared,
            uncachedInitial,
            uncachedUpdated,
          ].map((result) => result?.config.count),
        ).toEqual([1, 1, 2, 2, 2, 3]);
      },
    );
  },
);
