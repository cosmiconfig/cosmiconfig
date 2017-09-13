'use strict';

const fsMock = require('fs');
const path = require('path');

const cosmiconfig = require('../src');

const absolutePath = (exports.absolutePath = str => path.join(__dirname, str));

exports.configFileLoader = function configFileLoader(options, file) {
  const loadConfig = cosmiconfig(null, options).load;
  return loadConfig(null, absolutePath(file));
};

const chainFuncsSync = (result, func) => func(result);
const chainFuncsAsync = (result, func) => result.then(func);

exports.testFuncsRunner = (sync, init, funcs) =>
  funcs.reduce(sync === true ? chainFuncsSync : chainFuncsAsync, init);

/**
 * A utility function to run a given test in both sync and async.
 *
 * @param {string} name
 * @param {Function} testFn
 */
exports.testSyncAndAsync = function testSyncAndAsync(name, testFn) {
  describe('sync', () => {
    it(name, testFn(true));
  });

  describe('async', () => {
    it(name, testFn(false));
  });
};

exports.mockStatIsDirectory = function mockStatIsDirectory(result) {
  const stats = {
    isDirectory: () => result,
  };

  jest.spyOn(fsMock, 'stat').mockImplementation((path, callback) => {
    callback(null, stats);
  });

  jest.spyOn(fsMock, 'statSync').mockImplementation(() => stats);
};

exports.assertSearchSequence = function assertSearchSequence(
  readFileMock,
  searchPaths,
  startCount
) {
  startCount = startCount || 0;

  expect(readFileMock).toHaveBeenCalledTimes(searchPaths.length + startCount);

  searchPaths.forEach((searchPath, idx) => {
    expect(readFileMock.mock.calls[idx + startCount][0]).toBe(
      path.join(__dirname, searchPath)
    );
  });
};

function makeReadFileMockImpl(readFile) {
  return (searchPath, encoding, callback) => {
    try {
      callback(null, readFile(searchPath));
    } catch (err) {
      callback(err);
    }
  };
}
exports.makeReadFileMockImpl = makeReadFileMockImpl;

exports.mockReadFile = function mockReadFile(sync, readFile) {
  if (sync === true) {
    return jest.spyOn(fsMock, 'readFileSync').mockImplementation(readFile);
  } else {
    return jest
      .spyOn(fsMock, 'readFile')
      .mockImplementation(makeReadFileMockImpl(readFile));
  }
};
