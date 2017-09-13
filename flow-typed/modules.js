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

declare module 'is-promise' {
  declare function isPromise(arg: Promise<*>): true;
  declare function isPromise(arg: *): false;
  declare module.exports: isPromise;
}
