declare module 'is-directory' {
  declare module.exports: {
    (filename: string, (err: ?Error, result: boolean) => void): void,
    sync(filename: string): boolean,
  };
}

declare module 'parse-json' {
  declare module.exports: (
    input: string,
    reviver?: Function,
    filename?: string
  ) => Object;
}
