'use strict';

const fs = require('fs');
const isDirectory = require('../src/isDirectory');

test('returns true if the filepath is a directory', () => {
  expect.assertions(2);
  expect(isDirectory.sync(fs, __dirname)).toBe(true);
  return expect(isDirectory(fs, __dirname)).resolves.toBe(true);
});

test('returns false if the filepath is a file', () => {
  expect.assertions(2);
  expect(isDirectory.sync(fs, __filename)).toBe(false);
  return expect(isDirectory(fs, __filename)).resolves.toBe(false);
});

test('returns false if the filepath does not exist', () => {
  expect.assertions(2);
  expect(isDirectory.sync(fs, 'missing.filepath')).toBe(false);
  return expect(isDirectory(fs, 'missing.filepath')).resolves.toBe(false);
});

test('throws an error if the filepath is not a string', () => {
  expect.assertions(2);
  expect(() => isDirectory.sync(fs)).toThrow(
    'expected filepath to be a string'
  );
  return isDirectory(fs).catch(err => {
    expect(err.message).toBe('expected filepath to be a string');
  });
});
