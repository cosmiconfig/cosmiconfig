import os from 'os';
import parentModule from 'parent-module';
import path from 'path';
import { Mock, SpyInstance, vi } from 'vitest';

const fs = await vi.importActual<typeof import('fs')>('fs');

function normalizeDirectorySlash(pathname: string): string {
  const normalizeCrossPlatform = pathname.replace(/\\/g, '/');

  return normalizeCrossPlatform;
}

export class TempDir {
  public dir: string;

  public constructor() {
    /**
     * Get the actual path for temp directories that are symlinks (MacOS).
     * Without the actual path, tests that use process.chdir will unexpectedly
     * return the real path instead of symlink path.
     */
    const tempDir = fs.realpathSync(os.tmpdir());
    /**
     * Get the pathname of the file that imported util.js.
     * Used to create a unique directory name for each test suite.
     */
    const parent = parentModule() || '@cosmiconfig/core';
    const relativeParent = path.relative(process.cwd(), parent);

    /**
     * Each temp directory will be unique to the test file.
     * This ensures that temp files/dirs won't cause side effects for other tests.
     */
    this.dir = path.resolve(
      tempDir,
      '@cosmiconfig/core',
      `${relativeParent}-dir`,
    );

    // create directory
    fs.mkdirSync(this.dir, { recursive: true });

    // re-enable once: https://github.com/typescript-eslint/typescript-eslint/issues/636
    /* eslint-disable @typescript-eslint/unbound-method */
    this.absolutePath = this.absolutePath.bind(this);
    this.createDir = this.createDir.bind(this);
    this.createFile = this.createFile.bind(this);
    this.clean = this.clean.bind(this);
    this.deleteTempDir = this.deleteTempDir.bind(this);
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  public absolutePath(dir: string): string {
    // Use path.join to ensure dir is always inside the working temp directory
    const absolutePath = path.join(this.dir, dir);

    return absolutePath;
  }

  public createDir(dir: string): void {
    const dirname = this.absolutePath(dir);
    fs.mkdirSync(dirname, { recursive: true });
  }

  public createFile(file: string, contents: string): void {
    const filePath = this.absolutePath(file);
    const fileDir = path.parse(filePath).dir;
    fs.mkdirSync(fileDir, { recursive: true });

    fs.writeFileSync(filePath, `${contents}\n`);
  }

  public getSpyPathCalls(spy: Mock | SpyInstance): Array<string> {
    const calls = spy.mock.calls;

    const result = calls
      .map((call): string => {
        const filePath = call[0];
        const relativePath = path.relative(this.dir, filePath);

        /**
         * Replace Windows backslash directory separators with forward slashes
         * so expected paths will be consistent cross platform
         */
        const normalizeCrossPlatform = normalizeDirectorySlash(relativePath);

        return normalizeCrossPlatform;
      })
      .filter((filePath): boolean => {
        /**
         * Filter out `fs` calls that are made within cosmiconfig's dependency
         * tree.
         */
        return !filePath.includes('/@cosmiconfig/core/node_modules/');
      });

    return result;
  }

  public deleteTempDir(): void {
    fs.rmSync(normalizeDirectorySlash(this.dir), {
      force: true,
      recursive: true,
    });
  }

  public clean(): void {
    this.deleteTempDir();
    fs.mkdirSync(this.dir, { recursive: true });
  }
}
