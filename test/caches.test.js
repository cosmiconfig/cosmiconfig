'use strict';

jest.mock('fs');

const fsMock = require('fs');

const util = require('./util');
const cosmiconfig = require('../src');

const absolutePath = util.absolutePath;
const mockStatIsDirectory = util.mockStatIsDirectory;

beforeAll(() => {
  function readFile(searchPath) {
    switch (searchPath) {
      case absolutePath('a/b/c/d/e/f/package.json'):
      case absolutePath('a/b/c/d/e/f/.foorc'):
      case absolutePath('a/b/c/d/e/f/foo.config.js'):
      case absolutePath('a/b/c/d/e/package.json'):
      case absolutePath('a/b/c/d/e/.foorc'):
      case absolutePath('a/b/c/d/e/foo.config.js'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/c/d/package.json'):
        return '{ "false": "hope" }';
      case absolutePath('a/b/c/d/.foorc'):
        return '{ "foundInD": true }';
      case absolutePath('a/b/c/d/foo.config.js'):
      case absolutePath('a/b/c/package.json'):
      case absolutePath('a/b/c/.foorc'):
      case absolutePath('a/b/c/foo.config.js'):
        throw { code: 'ENOENT' };
      case absolutePath('a/b/package.json'):
        return '{ "foo": { "foundInB": true } }';
      default:
        throw new Error(`irrelevant path ${searchPath}`);
    }
  }

  jest
    .spyOn(fsMock, 'readFile')
    .mockImplementation(util.makeReadFileMockImpl(readFile));
  jest.spyOn(fsMock, 'readFileSync').mockImplementation(readFile);
});

function resetFsMocks() {
  // Resets all information stored in the mock,
  // including any inital implementation given.
  fsMock.stat.mockReset();
  fsMock.statSync.mockReset();

  // Clean up a mock's usage data between tests
  fsMock.readFile.mockClear();
  fsMock.readFileSync.mockClear();
}

afterEach(() => {
  resetFsMocks();
});

afterAll(() => {
  jest.resetAllMocks();
});

// const cachedLoaderFor = sync =>
//   sync === true ? cachedLoadConfigSync : cachedLoadConfig;
// const readFileMockFor = sync =>
//   sync === true ? fsMock.readFileSync : fsMock.readFile;

describe('is not used initially', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    util.assertSearchSequence(readFileMock, [
      'a/b/c/d/e/package.json',
      'a/b/c/d/e/.foorc',
      'a/b/c/d/e/foo.config.js',
      'a/b/c/d/package.json',
      'a/b/c/d/.foorc',
    ]);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfig = cosmiconfig('foo').load;
    return cachedLoadConfig(searchPath).then(result => {
      checkResult(fsMock.readFile, result);
    });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    const result = cachedLoadConfigSync(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

describe('cache is used for already visited directories', () => {
  const searchPath = absolutePath('a/b/c/d/e');
  const checkResult = (readFileMock, result) => {
    expect(readFileMock).toHaveBeenCalledTimes(0);
    expect(result).toEqual({
      filepath: absolutePath('a/b/c/d/.foorc'),
      config: { foundInD: true },
    });
  };

  test('async', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfig = cosmiconfig('foo').load;
    mockStatIsDirectory(true);
    // First pass (tested above) ...
    return cachedLoadConfig(searchPath)
      .then(() => {
        // Reset mocks and search again.
        resetFsMocks();
        mockStatIsDirectory(true);
        return cachedLoadConfig(searchPath);
      })
      .then(result => {
        checkResult(fsMock.readFile, result);
      });
  });

  test('sync', () => {
    mockStatIsDirectory(true);
    const cachedLoadConfigSync = cosmiconfig('foo', { sync: true }).load;
    // First pass (tested above) ...
    cachedLoadConfigSync(searchPath);
    // Reset mocks and search again.
    resetFsMocks();
    mockStatIsDirectory(true);
    const result = cachedLoadConfigSync(searchPath);
    checkResult(fsMock.readFileSync, result);
  });
});

// describe(
//   'is used when some directories in search are already visted',
//   sync => () => {
//     const loadConfig = cachedLoaderFor(sync);
//     // E and D visited above, not F
//     const searchPath = absolutePath('a/b/c/d/e/f');
//     mockStatIsDirectory(true);

//     expect.hasAssertions();
//     return testFuncsRunner(sync, loadConfig(searchPath), [
//       result => {
//         util.assertSearchSequence(readFileMockFor(sync), [
//           'a/b/c/d/e/f/package.json',
//           'a/b/c/d/e/f/.foorc',
//           'a/b/c/d/e/f/foo.config.js',
//         ]);
//         expect(result).toEqual({
//           filepath: absolutePath('a/b/c/d/.foorc'),
//           config: { foundInD: true },
//         });
//       },
//     ]);
//   }
// );

// describe('is not used for unvisited config file', () => {
//   const loadConfig = cachedLoaderFor(sync);
//   // B not yet visited
//   const configFile = absolutePath('a/b/package.json');
//   mockStatIsDirectory(false);

//   expect.hasAssertions();
//   return testFuncsRunner(sync, loadConfig(null, configFile), [
//     result => {
//       expect(readFileMockFor(sync)).toHaveBeenCalledTimes(1);
//       expect(result).toEqual({
//         filepath: absolutePath('a/b/package.json'),
//         config: { foundInB: true },
//       });
//     },

// describe(
//   'is not used in a new cosmiconfig instance',
//   sync => () => {
//     const loadConfig = cosmiconfig('foo', { sync }).load;
//     const searchPath = absolutePath('a/b/c/d/e');
//     mockStatIsDirectory(true);

//     expect.hasAssertions();
//     return testFuncsRunner(sync, loadConfig(searchPath), [
//       result => {
//         util.assertSearchSequence(readFileMockFor(sync), [
//           'a/b/c/d/e/package.json',
//           'a/b/c/d/e/.foorc',
//           'a/b/c/d/e/foo.config.js',
//           'a/b/c/d/package.json',
//           'a/b/c/d/.foorc',
//         ]);
//         expect(result).toEqual({
//           filepath: absolutePath('a/b/c/d/.foorc'),
//           config: { foundInD: true },
//         });
//       },
//     ]);
//   }
// );

// describe('still works on old instance', () => {
//   const loadConfig = cachedLoaderFor(sync);
//   const searchPath = absolutePath('a/b/c/d/e');
//   mockStatIsDirectory(true);

//   expect.hasAssertions();
//   return testFuncsRunner(sync, loadConfig(searchPath), [
//     result => {
//       expect(readFileMockFor(sync)).toHaveBeenCalledTimes(0);
//       expect(result).toEqual({
//         filepath: absolutePath('a/b/c/d/.foorc'),
//         config: { foundInD: true },
//       });
//     },

// describe(
//   'clears file cache on calling clearFileCache',
//   sync => () => {
//     const explorer = cosmiconfig('foo', { sync });
//     const searchPath = absolutePath('a/b/c/d/.foorc');
//     mockStatIsDirectory(false);

//     const expectedResult = {
//       filepath: absolutePath('a/b/c/d/.foorc'),
//       config: { foundInD: true },
//     };
//     const readFileMock = readFileMockFor(sync);

//     function expectation(result) {
//       util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
//       expect(result).toEqual(expectedResult);
//     }

//     expect.hasAssertions();
//     return testFuncsRunner(sync, explorer.load(null, searchPath), [
//       expectation,
//       () => explorer.load(null, searchPath),
//       expectation,
//       () => {
//         explorer.clearFileCache();
//       },
//       () => explorer.load(null, searchPath),
//       result => {
//         util.assertSearchSequence(readFileMock, [
//           'a/b/c/d/.foorc',
//           'a/b/c/d/.foorc',
//         ]);
//         expect(result).toEqual(expectedResult);
//       },
//     ]);

// describe(
//   'clears directory cache on calling clearDirectoryCache',
//   sync => () => {
//     const explorer = cosmiconfig('foo', { sync });
//     const searchPath = absolutePath('a/b/c/d/e');
//     mockStatIsDirectory(true);

//     const expectedResult = {
//       filepath: absolutePath('a/b/c/d/.foorc'),
//       config: { foundInD: true },
//     };
//     const readFileMock = readFileMockFor(sync);

//     function expectation(result) {
//       util.assertSearchSequence(readFileMock, [
//         'a/b/c/d/e/package.json',
//         'a/b/c/d/e/.foorc',
//         'a/b/c/d/e/foo.config.js',
//         'a/b/c/d/package.json',
//         'a/b/c/d/.foorc',
//       ]);
//       expect(result).toEqual(expectedResult);
//     }

//     expect.hasAssertions();
//     return testFuncsRunner(sync, explorer.load(searchPath), [
//       expectation,
//       () => explorer.load(searchPath),
//       expectation,
//       () => {
//         explorer.clearDirectoryCache();
//       },
//       () => explorer.load(searchPath),
//       result => {
//         util.assertSearchSequence(readFileMock, [
//           'a/b/c/d/e/package.json',
//           'a/b/c/d/e/.foorc',
//           'a/b/c/d/e/foo.config.js',
//           'a/b/c/d/package.json',
//           'a/b/c/d/.foorc',
//           'a/b/c/d/e/package.json',
//           'a/b/c/d/e/.foorc',
//           'a/b/c/d/e/foo.config.js',
//           'a/b/c/d/package.json',
//           'a/b/c/d/.foorc',
//         ]);
//         expect(result).toEqual(expectedResult);
//       },
//     ]);

// describe(
//   'clears both file and directory cache on calling clearCaches',
//   sync => () => {
//     const explorer = cosmiconfig('foo', { sync });
//     const searchPathFile = absolutePath('a/b/c/d/.foorc');
//     const searchPathDir = absolutePath('a/b/c/d/e');
//     mockStatIsDirectory(true);

//     const expectedResult = {
//       filepath: absolutePath('a/b/c/d/.foorc'),
//       config: { foundInD: true },
//     };
//     const readFileMock = readFileMockFor(sync);

//     function freshLoadFileExpect(result) {
//       util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
//       expect(result).toEqual(expectedResult);
//       readFileMock.mockClear();
//     }

//     function freshLoadDirExpect(result) {
//       util.assertSearchSequence(readFileMock, [
//         'a/b/c/d/e/package.json',
//         'a/b/c/d/e/.foorc',
//         'a/b/c/d/e/foo.config.js',
//         'a/b/c/d/package.json',
//         'a/b/c/d/.foorc',
//       ]);
//       expect(result).toEqual(expectedResult);
//       readFileMock.mockClear();
//     }

//     function loadFromFile() {
//       mockStatIsDirectory(false);
//       return explorer.load(null, searchPathFile);
//     }

//     function loadFromDir() {
//       mockStatIsDirectory(true);
//       return explorer.load(searchPathDir);
//     }

//     expect.hasAssertions();
//     return testFuncsRunner(sync, loadFromFile(), [
//       freshLoadFileExpect,
//       loadFromFile,
//       result => {
//         // cachedLoadFileExpect
//         expect(readFileMock).not.toHaveBeenCalled();
//         expect(result).toEqual(expectedResult);
//       },
//       loadFromDir,
//       freshLoadDirExpect,
//       loadFromDir,
//       result => {
//         // cachedLoadDirExpect
//         expect(readFileMock).not.toHaveBeenCalled(); // so no need to clear
//         expect(result).toEqual(expectedResult);
//       },
//       () => {
//         explorer.clearCaches();
//       },
//       loadFromDir,
//       freshLoadDirExpect,
//       loadFromFile,
//       freshLoadFileExpect,
//     ]);
//   }
// );
// });

// describe('cache disabled', () => {
// const explorer = cosmiconfig('foo', { cache: false });

// it('does not throw an error when clearFileCache is called', () => {
//   expect(() => explorer.clearFileCache()).not.toThrow();
// });

// it('does not throw an error when clearDirectoryCache is called', () => {
//   expect(() => explorer.clearDirectoryCache()).not.toThrow();
// });
// it('does not throw an error when clearCaches is called', () => {
//   expect(() => explorer.clearCaches()).not.toThrow();
// });

// describe('does not cache directory results', () => {
//   const loadConfig = cosmiconfig('foo', { sync, cache: false }).load;
//   const searchPath = absolutePath('a/b/c/d');
//   mockStatIsDirectory(true);

//   const expectedResult = {
//     filepath: absolutePath('a/b/c/d/.foorc'),
//     config: { foundInD: true },
//   };
//   const readFileMock = readFileMockFor(sync);

//   function expectation(result) {
//     util.assertSearchSequence(readFileMock, [
//       'a/b/c/d/package.json',
//       'a/b/c/d/.foorc',
//     ]);
//     expect(result).toEqual(expectedResult);
//     readFileMock.mockClear();
//   }

//   expect.hasAssertions();
//   return testFuncsRunner(sync, loadConfig(searchPath), [
//     expectation,
//     () => loadConfig(searchPath),
//     expectation,
//   ]);
// });

// describe('does not cache file results', () => {
//   const explorer = cosmiconfig('foo', { sync, cache: false });
//   const searchPath = absolutePath('a/b/c/d/.foorc');
//   mockStatIsDirectory(false);

//   const expectedResult = {
//     filepath: absolutePath('a/b/c/d/.foorc'),
//     config: { foundInD: true },
//   };
//   const readFileMock = readFileMockFor(sync);

//   function expectation(result) {
//     util.assertSearchSequence(readFileMock, ['a/b/c/d/.foorc']);
//     expect(result).toEqual(expectedResult);
//     readFileMock.mockClear();
//   }

//   expect.hasAssertions();
//   return testFuncsRunner(sync, explorer.load(null, searchPath), [
//     expectation,
//     () => explorer.load(null, searchPath),
//     expectation,
//   ]);
// });
