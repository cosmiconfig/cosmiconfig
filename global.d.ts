// https://github.com/jonschlinkert/is-directory/blob/master/index.d.ts
declare module 'is-directory' {
  interface IsDirectory {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (path: string, cb: (err: any, dir: boolean) => void): string;
    sync(path: string): boolean;
  }

  declare const isDirectory: IsDirectory;
  export = isDirectory;
}
