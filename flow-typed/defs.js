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
type ExplorerOptions = {
  moduleName: string,
  packageProp: string | false,
  rc: string | false,
  js: string | false,
  rcStrictJson: boolean,
  rcExtensions: boolean,
  stopDir: string,
  cache: boolean,
  transform?: CosmiconfigResult => CosmiconfigResult,
  configPath?: string,
};

type Loader = (string, string) => Object | null;

type RawSearchSchemaItem =
  | string
  | {
      filename: string,
      loader?: Loader,
      property?: string,
    };

type SearchSchemaItem = {
  filename: string,
  loader: Loader,
  property: string | null,
};
