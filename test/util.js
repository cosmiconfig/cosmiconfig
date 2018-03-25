'use strict';

const fsMock = require('fs');
const path = require('path');

exports.absolutePath = str => path.join(__dirname, str);

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
