declare module 'is-directory' {
  export = exports;
  const exports: {
    (
      filename: string,
      cb: (err: Error | undefined, result: boolean) => void
    ): void;
    sync(filename: string): boolean;
  };
}
