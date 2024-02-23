import { describe, test, expect } from 'vitest';
import { getPropertyByPath } from '../src/util';

const source = {
  ant: {
    beetle: {
      cootie: {
        flea: 'foo',
      },
      louse: {
        vermin: 'bar',
      },
    },
    'fancy.name': {
      'another.fancy.name': 9,
    },
  },
  'ant.beetle.cootie': 333,
};

describe('with a property name that includes a period', () => {
  test('does not treat it as a period-delimited path', () => {
    expect(getPropertyByPath(source, 'ant.beetle.cootie')).toBe(333);
  });
});

describe('with period-delimited string path', () => {
  test('returns a defined value', () => {
    expect(getPropertyByPath(source, 'ant')).toBe(source.ant);

    expect(getPropertyByPath(source, 'ant.beetle.cootie.flea')).toBe('foo');

    expect(getPropertyByPath(source, 'ant.beetle.louse')).toBe(
      source.ant.beetle.louse,
    );
  });

  test('returns undefined', () => {
    expect(getPropertyByPath(source, 'beetle')).toBeUndefined();

    expect(
      getPropertyByPath(source, 'ant.beetle.cootie.fleeee'),
    ).toBeUndefined();

    expect(getPropertyByPath(source, 'ant.beetle.vermin')).toBeUndefined();

    expect(getPropertyByPath(source, 'ant.fancy.name')).toBeUndefined();
  });
});

describe('with array path', () => {
  test('returns a defined value', () => {
    expect(getPropertyByPath(source, ['ant'])).toBe(source.ant);

    expect(getPropertyByPath(source, ['ant', 'beetle', 'cootie', 'flea'])).toBe(
      'foo',
    );

    expect(getPropertyByPath(source, ['ant', 'beetle', 'louse'])).toBe(
      source.ant.beetle.louse,
    );
  });

  test('returns undefined', () => {
    expect(getPropertyByPath(source, ['beetle'])).toBeUndefined();

    expect(
      getPropertyByPath(source, ['ant', 'beetle', 'cootie', 'fleeee']),
    ).toBeUndefined();

    expect(
      getPropertyByPath(source, ['ant', 'beetle', 'vermin']),
    ).toBeUndefined();
  });

  test('handles property names with periods', () => {
    expect(
      getPropertyByPath(source, ['ant', 'fancy.name', 'another.fancy.name']),
    ).toBe(9);

    expect(
      getPropertyByPath(source, [
        'ant',
        'fancy.name',
        'another.fancy.name',
        'foo',
      ]),
    ).toBeUndefined();

    expect(getPropertyByPath(source, ['ant', 'fancy.namez'])).toBeUndefined();
  });
});
