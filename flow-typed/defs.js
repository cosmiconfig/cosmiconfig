type CosmiconfigResult = {
  config: any,
  filepath: string,
  isEmpty?: boolean,
} | null;

type LoaderResult = {
  config: Object | null,
  filepath: string,
};

// These are the user options with defaults applied.
type CreateExplorerOptions = {
  packageProp: string | false,
  rc: string | false,
  js: string | false,
  rcStrictJson: boolean,
  rcExtensions: boolean,
  stopDir: string,
  cache: boolean,
  sync: boolean,
  transform?: (?Object) => ?Object,
  configPath?: string,
};