'use strict';

const getPropertyPath = require('../src/getPropertyByPath');

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
};

describe('with period-delimited string path', () => {
  test('returns a defined value', () => {
    expect(getPropertyPath(source, 'ant')).toBe(source.ant);

    expect(getPropertyPath(source, 'ant.beetle.cootie.flea')).toBe('foo');

    expect(getPropertyPath(source, 'ant.beetle.louse')).toBe(
      source.ant.beetle.louse
    );
  });

  test('returns undefined', () => {
    expect(getPropertyPath(source, 'beetle')).toBeUndefined();

    expect(getPropertyPath(source, 'ant.beetle.cootie.fleeee')).toBeUndefined();

    expect(getPropertyPath(source, 'ant.beetle.vermin')).toBeUndefined();

    expect(getPropertyPath(source, 'ant.fancy.name')).toBeUndefined();
  });
});

describe('with array path', () => {
  test('returns a defined value', () => {
    expect(getPropertyPath(source, ['ant'])).toBe(source.ant);

    expect(getPropertyPath(source, ['ant', 'beetle', 'cootie', 'flea'])).toBe(
      'foo'
    );

    expect(getPropertyPath(source, ['ant', 'beetle', 'louse'])).toBe(
      source.ant.beetle.louse
    );
  });

  test('returns undefined', () => {
    expect(getPropertyPath(source, ['beetle'])).toBeUndefined();

    expect(
      getPropertyPath(source, ['ant', 'beetle', 'cootie', 'fleeee'])
    ).toBeUndefined();

    expect(
      getPropertyPath(source, ['ant', 'beetle', 'vermin'])
    ).toBeUndefined();
  });

  test('handles property names with periods', () => {
    expect(
      getPropertyPath(source, ['ant', 'fancy.name', 'another.fancy.name'])
    ).toBe(9);

    expect(
      getPropertyPath(source, [
        'ant',
        'fancy.name',
        'another.fancy.name',
        'foo',
      ])
    ).toBeUndefined;

    expect(getPropertyPath(source, ['ant', 'fancy.namez'])).toBeUndefined;
  });
});
