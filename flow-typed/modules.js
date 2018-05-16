declare module 'parse-json' {
  declare module.exports: (
    input: string,
    reviver?: Function,
    filename?: string
  ) => Object;
}
