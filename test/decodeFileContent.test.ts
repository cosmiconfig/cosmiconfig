import { describe, test, expect } from 'vitest';
import { decodeFileContent } from '../src/util';
import { utf16beBuffer } from './util';

describe('with a UTF-16LE byte-order mark', () => {
  test('decodes as UTF-16LE and strips the BOM', () => {
    const bom = Buffer.from([0xff, 0xfe]);
    const content = Buffer.from('{ "foo": true }', 'utf16le');
    expect(decodeFileContent(Buffer.concat([bom, content]))).toBe(
      '{ "foo": true }',
    );
  });
});

describe('with a UTF-16BE byte-order mark', () => {
  test('decodes as UTF-16BE and strips the BOM', () => {
    const bom = Buffer.from([0xfe, 0xff]);
    const content = utf16beBuffer('{ "foo": true }');
    expect(decodeFileContent(Buffer.concat([bom, content]))).toBe(
      '{ "foo": true }',
    );
  });
});

describe('with no UTF-16 byte-order mark', () => {
  test('decodes as UTF-8, identically to Buffer#toString("utf-8")', () => {
    const content = Buffer.from('{ "foo": true }', 'utf8');
    expect(decodeFileContent(content)).toBe(content.toString('utf-8'));
  });

  test('leaves a UTF-8 byte-order mark untouched, matching prior behavior', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const content = Buffer.concat([
      bom,
      Buffer.from('{ "foo": true }', 'utf8'),
    ]);
    expect(decodeFileContent(content)).toBe(content.toString('utf-8'));
    expect(decodeFileContent(content).charCodeAt(0)).toBe(0xfeff);
  });
});
